import { INSTANCE_BYTE_STRIDE, InstanceBuffer } from './instanceBuffer.ts';
import { fragmentShaderSource, vertexShaderSource } from './shaders.ts';
import { normalizeSpriteIdentifier, prepareSpriteAtlas, type ResolvedSprite } from './spriteAtlas.ts';

import type { SpriteAtlasImage, SpriteIdentifier, SpriteLookup } from './types.ts';

/**
 * Owns the WebGL2 resources used to upload sprite instances and render them in a single instanced draw call.
 */
export class Renderer {
	/** Raw WebGL2 context used by the sprite renderer and trusted render hooks. */
	readonly gl: WebGL2RenderingContext;
	/** Mutable internal storage exposed by `Engine` as a readonly live statistics view. */
	readonly frameStats = {
		spriteCount: 0,
		uploadedInstanceBytes: 0,
	};
	private readonly program: WebGLProgram;
	private readonly instanceBufferObject: WebGLBuffer;
	private readonly vertexArray: WebGLVertexArrayObject;
	private readonly instances: InstanceBuffer;
	private readonly resolutionLocation: WebGLUniformLocation;
	private readonly atlasSizeLocation: WebGLUniformLocation;
	private readonly atlasSamplerLocation: WebGLUniformLocation;
	private readonly lookupSamplerLocation: WebGLUniformLocation;
	private gpuCapacity: number;
	private atlasTexture: WebGLTexture | null = null;
	private lookupTexture: WebGLTexture | null = null;
	private atlasWidth = 0;
	private atlasHeight = 0;
	private sprites = new Map<string, ResolvedSprite>();
	private destroyed = false;

	/**
	 * Creates a renderer and allocates its initial CPU and GPU instance buffers.
	 *
	 * @param canvas - Canvas whose WebGL2 context receives the rendered sprites.
	 * @param initialCapacity - Number of sprite instances to allocate space for initially.
	 */
	constructor(
		private readonly canvas: HTMLCanvasElement,
		initialCapacity: number
	) {
		const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
		if (!gl) {
			throw new Error('WebGL2 is required but unavailable.');
		}

		this.gl = gl;
		this.instances = new InstanceBuffer(initialCapacity);
		this.gpuCapacity = this.instances.capacity;
		const resources = createRendererResources(gl);
		this.program = resources.program;
		this.instanceBufferObject = resources.instanceBuffer;
		this.vertexArray = resources.vertexArray;
		this.resolutionLocation = resources.resolutionLocation;
		this.atlasSizeLocation = resources.atlasSizeLocation;
		this.atlasSamplerLocation = resources.atlasSamplerLocation;
		this.lookupSamplerLocation = resources.lookupSamplerLocation;

		gl.useProgram(this.program);
		gl.bindVertexArray(this.vertexArray);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBufferObject);
		gl.bufferData(gl.ARRAY_BUFFER, this.gpuCapacity * INSTANCE_BYTE_STRIDE, gl.DYNAMIC_DRAW);

		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 4, gl.FLOAT, false, INSTANCE_BYTE_STRIDE, 0);
		gl.vertexAttribDivisor(0, 1);
		gl.enableVertexAttribArray(1);
		gl.vertexAttribIPointer(1, 1, gl.UNSIGNED_INT, INSTANCE_BYTE_STRIDE, 4 * Uint32Array.BYTES_PER_ELEMENT);
		gl.vertexAttribDivisor(1, 1);

		gl.uniform1i(this.atlasSamplerLocation, 0);
		gl.uniform1i(this.lookupSamplerLocation, 1);
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.clearColor(0, 0, 0, 1);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	/**
	 * Uploads a sprite atlas and its rectangle lookup table, replacing any previously uploaded atlas.
	 *
	 * @param image - Image containing all sprites in the atlas.
	 * @param lookup - Mapping from sprite identifiers to rectangles within the atlas image.
	 */
	setSpriteAtlas(image: SpriteAtlasImage, lookup: SpriteLookup): void {
		this.assertLive();
		const { width, height } = image;
		const prepared = prepareSpriteAtlas(lookup, width, height);
		const maxTextureSize = Number(this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE));
		if (prepared.sprites.size > maxTextureSize) {
			throw new RangeError(`The sprite lookup exceeds the GPU limit of ${maxTextureSize} entries.`);
		}

		const nextAtlasTexture = requireResource(this.gl.createTexture(), 'atlas texture');
		const nextLookupTexture = this.gl.createTexture();
		if (!nextLookupTexture) {
			this.gl.deleteTexture(nextAtlasTexture);
			throw new Error('Could not create the WebGL sprite lookup texture.');
		}

		try {
			this.uploadAtlasTexture(nextAtlasTexture, image);
			this.uploadLookupTexture(nextLookupTexture, prepared.metadata, prepared.sprites.size);
		} catch (error) {
			this.gl.deleteTexture(nextAtlasTexture);
			this.gl.deleteTexture(nextLookupTexture);
			throw error;
		}

		if (this.atlasTexture) {
			this.gl.deleteTexture(this.atlasTexture);
		}
		if (this.lookupTexture) {
			this.gl.deleteTexture(this.lookupTexture);
		}

		this.atlasTexture = nextAtlasTexture;
		this.lookupTexture = nextLookupTexture;
		this.atlasWidth = width;
		this.atlasHeight = height;
		this.sprites = prepared.sprites;
	}

	/**
	 * Starts a frame by clearing the queued instances and the canvas color buffer.
	 *
	 * This per-frame path intentionally performs no destruction-state validation.
	 */
	beginFrame(): void {
		this.instances.reset();
		const gl = this.gl;
		// Hooks share the raw context and may leave clear-related state dirty. These repeated assignments intentionally
		// establish the next frame's clear boundary; do not remove them as redundant constructor setup.
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.colorMask(true, true, true, true);
		gl.disable(gl.SCISSOR_TEST);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);
	}

	/**
	 * Writes one sprite directly into the reusable CPU-side instance buffer.
	 *
	 * This hot-path method intentionally does not validate programmer input. Invalid identifiers, coordinates, or dimensions
	 * are programmer errors with unspecified consequences.
	 *
	 * @param x - Horizontal position of the sprite's top-left corner in canvas pixels.
	 * @param y - Vertical position of the sprite's top-left corner in canvas pixels.
	 * @param spriteIdentifier - Identifier associated with the sprite in the current atlas lookup.
	 * @param width - Rendered width in pixels, or the atlas rectangle width when omitted.
	 * @param height - Rendered height in pixels, or the atlas rectangle height when omitted.
	 */
	drawSprite(x: number, y: number, spriteIdentifier: SpriteIdentifier, width?: number, height?: number): void {
		const sprite = this.sprites.get(normalizeSpriteIdentifier(spriteIdentifier))!;
		const resolvedWidth = width ?? sprite.spriteWidth;
		const resolvedHeight = height ?? sprite.spriteHeight;
		this.instances.append(x, y, resolvedWidth, resolvedHeight, sprite.id);
	}

	/**
	 * Uploads the used portion of the instance buffer and renders all queued sprites in insertion order.
	 *
	 * This per-frame path intentionally performs no destruction-state validation.
	 */
	flush(): void {
		const spriteCount = this.instances.count;
		this.frameStats.spriteCount = spriteCount;
		this.frameStats.uploadedInstanceBytes = 0;
		if (spriteCount === 0) {
			return;
		}
		if (!this.atlasTexture || !this.lookupTexture) {
			throw new Error('A sprite atlas must be set before drawing sprites.');
		}

		const gl = this.gl;
		// Raw-context hooks may change any ordinary WebGL binding or capability. Reassert every state dependency of the
		// sprite pass here; this defensive work is intentional and must not be cleaned up as apparently duplicate setup.
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, this.canvas.width, this.canvas.height);
		gl.useProgram(this.program);
		gl.bindVertexArray(this.vertexArray);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBufferObject);
		gl.enable(gl.BLEND);
		gl.blendEquation(gl.FUNC_ADD);
		gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.colorMask(true, true, true, true);
		gl.disable(gl.SCISSOR_TEST);
		gl.disable(gl.DEPTH_TEST);
		gl.disable(gl.STENCIL_TEST);
		gl.disable(gl.CULL_FACE);
		gl.disable(gl.RASTERIZER_DISCARD);
		if (this.instances.capacity > this.gpuCapacity) {
			this.gpuCapacity = this.instances.capacity;
			gl.bufferData(gl.ARRAY_BUFFER, this.gpuCapacity * INSTANCE_BYTE_STRIDE, gl.DYNAMIC_DRAW);
		}
		const instanceBytes = this.instances.usedBytes();
		gl.bufferSubData(gl.ARRAY_BUFFER, 0, instanceBytes);
		this.frameStats.uploadedInstanceBytes = instanceBytes.byteLength;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.lookupTexture);
		gl.uniform1i(this.atlasSamplerLocation, 0);
		gl.uniform1i(this.lookupSamplerLocation, 1);
		gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
		gl.uniform2f(this.atlasSizeLocation, this.atlasWidth, this.atlasHeight);
		gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, spriteCount);
	}

	/**
	 * Changes the canvas drawing-buffer dimensions and updates the WebGL viewport.
	 *
	 * @param width - New canvas width in pixels.
	 * @param height - New canvas height in pixels.
	 */
	resize(width: number, height: number): void {
		this.assertLive();
		assertPositiveInteger(width, 'width');
		assertPositiveInteger(height, 'height');
		this.canvas.width = width;
		this.canvas.height = height;
		this.gl.viewport(0, 0, width, height);
	}

	/**
	 * Releases every WebGL resource owned by this renderer.
	 *
	 * Calling this method more than once has no effect.
	 */
	destroy(): void {
		if (this.destroyed) {
			return;
		}
		this.destroyed = true;

		if (this.atlasTexture) {
			this.gl.deleteTexture(this.atlasTexture);
		}
		if (this.lookupTexture) {
			this.gl.deleteTexture(this.lookupTexture);
		}
		this.gl.deleteBuffer(this.instanceBufferObject);
		this.gl.deleteVertexArray(this.vertexArray);
		this.gl.deleteProgram(this.program);
		this.atlasTexture = null;
		this.lookupTexture = null;
		this.sprites.clear();
	}

	/**
	 * Uploads an atlas image and configures it for nearest-neighbor sprite sampling.
	 *
	 * @param texture - WebGL texture that receives the atlas image.
	 * @param image - Source image containing the sprite atlas.
	 */
	private uploadAtlasTexture(texture: WebGLTexture, image: SpriteAtlasImage): void {
		const gl = this.gl;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	/**
	 * Uploads sprite rectangles to an integer texture that the vertex shader indexes by sprite ID.
	 *
	 * @param texture - WebGL texture that receives the packed rectangle metadata.
	 * @param metadata - Packed x, y, width, and height values for each sprite.
	 * @param spriteCount - Number of sprite records represented by the metadata.
	 */
	private uploadLookupTexture(texture: WebGLTexture, metadata: Uint16Array, spriteCount: number): void {
		const gl = this.gl;
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16UI, spriteCount, 1, 0, gl.RGBA_INTEGER, gl.UNSIGNED_SHORT, metadata);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	/**
	 * Throws when an operation requiring live WebGL resources is attempted after destruction.
	 */
	private assertLive(): void {
		if (this.destroyed) {
			throw new Error('The glugglug2 renderer has been destroyed.');
		}
	}
}

/**
 * Compiles and links the vertex and fragment shaders into a WebGL program.
 *
 * @param gl - WebGL2 context used to create the program.
 * @param vertexSource - GLSL source for the vertex shader.
 * @param fragmentSource - GLSL source for the fragment shader.
 * @returns A linked WebGL program ready for use.
 */
function createProgram(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
	const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
	let fragmentShader: WebGLShader | null = null;
	let program: WebGLProgram | null = null;

	try {
		fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
		program = requireResource(gl.createProgram(), 'shader program');
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(gl.getProgramInfoLog(program) ?? 'Could not link the sprite shader program.');
		}
		return program;
	} catch (error) {
		if (program) {
			gl.deleteProgram(program);
		}
		throw error;
	} finally {
		gl.deleteShader(vertexShader);
		if (fragmentShader) {
			gl.deleteShader(fragmentShader);
		}
	}
}

/**
 * Creates the shader program, instance buffer, vertex array, and uniform locations required by the renderer.
 *
 * @param gl - WebGL2 context used to allocate the resources.
 * @returns The complete set of initialized renderer resources.
 */
function createRendererResources(gl: WebGL2RenderingContext): {
	program: WebGLProgram;
	instanceBuffer: WebGLBuffer;
	vertexArray: WebGLVertexArrayObject;
	resolutionLocation: WebGLUniformLocation;
	atlasSizeLocation: WebGLUniformLocation;
	atlasSamplerLocation: WebGLUniformLocation;
	lookupSamplerLocation: WebGLUniformLocation;
} {
	const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
	let instanceBuffer: WebGLBuffer | null = null;
	let vertexArray: WebGLVertexArrayObject | null = null;

	try {
		instanceBuffer = requireResource(gl.createBuffer(), 'instance buffer');
		vertexArray = requireResource(gl.createVertexArray(), 'vertex array');
		return {
			program,
			instanceBuffer,
			vertexArray,
			resolutionLocation: requireUniform(gl, program, 'u_resolution'),
			atlasSizeLocation: requireUniform(gl, program, 'u_atlasSize'),
			atlasSamplerLocation: requireUniform(gl, program, 'u_atlas'),
			lookupSamplerLocation: requireUniform(gl, program, 'u_spriteRectangles'),
		};
	} catch (error) {
		if (instanceBuffer) {
			gl.deleteBuffer(instanceBuffer);
		}
		if (vertexArray) {
			gl.deleteVertexArray(vertexArray);
		}
		gl.deleteProgram(program);
		throw error;
	}
}

/**
 * Compiles one GLSL shader and reports the compiler log when compilation fails.
 *
 * @param gl - WebGL2 context used to create the shader.
 * @param type - WebGL shader type, such as `VERTEX_SHADER` or `FRAGMENT_SHADER`.
 * @param source - GLSL source to compile.
 * @returns The compiled shader.
 */
function createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	const shader = requireResource(gl.createShader(type), 'shader');
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const message = gl.getShaderInfoLog(shader) ?? 'Could not compile a sprite shader.';
		gl.deleteShader(shader);
		throw new Error(message);
	}
	return shader;
}

/**
 * Narrows a nullable WebGL allocation result or throws a descriptive allocation error.
 *
 * @param resource - Resource returned by a WebGL creation call.
 * @param name - Human-readable resource name used in the error message.
 * @returns The allocated resource.
 */
function requireResource<T>(resource: T | null, name: string): T {
	if (!resource) {
		throw new Error(`Could not create the WebGL ${name}.`);
	}
	return resource;
}

/**
 * Resolves a required uniform location from a linked shader program.
 *
 * @param gl - WebGL2 context that owns the program.
 * @param program - Linked program containing the uniform.
 * @param name - GLSL uniform name to resolve.
 * @returns The resolved uniform location.
 */
function requireUniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
	const location = gl.getUniformLocation(program, name);
	if (!location) {
		throw new Error(`Could not find the ${name} shader uniform.`);
	}
	return location;
}

/**
 * Verifies that a numeric configuration value is a positive integer.
 *
 * @param value - Value to verify.
 * @param name - Parameter name used in the error message.
 */
function assertPositiveInteger(value: number, name: string): void {
	if (!Number.isInteger(value) || value <= 0) {
		throw new RangeError(`${name} must be a positive integer.`);
	}
}
