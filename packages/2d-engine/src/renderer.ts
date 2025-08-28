import {
	fillBufferWithLineVertices,
	fillBufferWithRectangleVertices,
	fillBufferWithSpriteCoordinates,
} from './utils/buffer';
import createProgram from './utils/createProgram';
import createShader from './utils/createShader';
import createTexture from './utils/createTexture';
import spriteFragmentShader from './shaders/spriteFragmentShader';
import spriteVertexShader from './shaders/spriteVertexShader';
import postProcessVertexShader from './shaders/postProcessVertexShader';
import scanlineFragmentShader from './shaders/scanlineFragmentShader';

/**
 * Low-level WebGL renderer - handles buffers, shaders, and GPU operations
 */
export class Renderer {
	gl: WebGL2RenderingContext | WebGLRenderingContext;
	program: WebGLProgram;
	glPositionBuffer: WebGLBuffer;
	glTextureCoordinateBuffer: WebGLBuffer;
	vertexBuffer: Float32Array;
	bufferPointer: number;
	textureCoordinateBuffer: Float32Array;
	spriteSheet: WebGLTexture;
	spriteSheetWidth: number;
	spriteSheetHeight: number;
	bufferSize: number;
	bufferCounter: number;
	timeLocation: WebGLUniformLocation | null;
	isPerformanceMeasurementMode: boolean;

	// Post-processing
	postProcessProgram: WebGLProgram;
	postProcessPositionBuffer: WebGLBuffer;
	postProcessTimeLocation: WebGLUniformLocation | null;
	postProcessResolutionLocation: WebGLUniformLocation | null;
	postProcessShakeIntensityLocation: WebGLUniformLocation | null;
	postProcessDistortionIntensityLocation: WebGLUniformLocation | null;
	postProcessTextureLocation: WebGLUniformLocation | null;

	// Render-to-texture
	renderFramebuffer: WebGLFramebuffer;
	renderTexture: WebGLTexture;
	renderTextureWidth: number;
	renderTextureHeight: number;

	constructor(canvas: HTMLCanvasElement) {
		// alpha: false = opaque canvas (slight performance gain)
		const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
		if (!gl) {
			throw new Error('Failed to get WebGL context');
		}
		this.gl = gl;

		// Compile and link shader program for sprite rendering
		this.program = createProgram(this.gl, [
			createShader(this.gl, spriteFragmentShader, this.gl.FRAGMENT_SHADER),
			createShader(this.gl, spriteVertexShader, this.gl.VERTEX_SHADER),
		]);

		// Compile and link post-process shader program
		this.postProcessProgram = createProgram(this.gl, [
			createShader(this.gl, scanlineFragmentShader, this.gl.FRAGMENT_SHADER),
			createShader(this.gl, postProcessVertexShader, this.gl.VERTEX_SHADER),
		]);

		// Get shader variable locations (returns -1 if not found)
		const a_position = this.gl.getAttribLocation(this.program, 'a_position'); // vertex position attribute
		const a_texcoord = this.gl.getAttribLocation(this.program, 'a_texcoord'); // texture coordinate attribute
		this.timeLocation = this.gl.getUniformLocation(this.program, 'u_time'); // time uniform for animations

		// Get post-process shader variable locations
		this.postProcessTimeLocation = this.gl.getUniformLocation(this.postProcessProgram, 'u_time');
		this.postProcessResolutionLocation = this.gl.getUniformLocation(this.postProcessProgram, 'u_resolution');
		this.postProcessShakeIntensityLocation = this.gl.getUniformLocation(this.postProcessProgram, 'u_shakeIntensity');
		this.postProcessDistortionIntensityLocation = this.gl.getUniformLocation(
			this.postProcessProgram,
			'u_distortionIntensity'
		);
		this.postProcessTextureLocation = this.gl.getUniformLocation(this.postProcessProgram, 'u_renderTexture');

		// Create GPU buffers (returns WebGLBuffer objects, data uploaded later)
		this.glTextureCoordinateBuffer = this.gl.createBuffer(); // UV coordinates buffer
		this.glPositionBuffer = this.gl.createBuffer(); // vertex positions buffer

		// Create post-process quad buffer (full-screen quad: -1,-1 to 1,1)
		this.postProcessPositionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.postProcessPositionBuffer);
		const quadVertices = new Float32Array([
			-1,
			-1, // bottom-left
			1,
			-1, // bottom-right
			-1,
			1, // top-left
			1,
			1, // top-right
		]);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);

		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height); // defines rendering area
		this.gl.clearColor(0, 0, 0, 1.0); // set clear color to black (RGBA)
		this.gl.clear(this.gl.COLOR_BUFFER_BIT); // fills with clearColor
		this.gl.useProgram(this.program); // bind shader program for rendering
		this.setUniform('u_resolution', canvas.width, canvas.height); // pass screen size to vertex shader

		// Configure vertex attributes (tells GPU how to read buffer data)
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer); // make this the active buffer
		this.gl.vertexAttribPointer(a_position, 2, this.gl.FLOAT, false, 0, 0); // 2 floats per vertex, no normalization, no stride/offset

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer); // switch to texture coords buffer
		this.gl.vertexAttribPointer(a_texcoord, 2, this.gl.FLOAT, false, 0, 0); // 2 floats per texture coordinate

		// Enable alpha blending for sprite transparency
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); // standard alpha blending formula
		this.gl.enable(this.gl.BLEND); // turn on blending (disabled by default)

		// Enable vertex attributes (make them available to vertex shader)
		this.gl.enableVertexAttribArray(a_texcoord); // enable a_texcoord attribute
		this.gl.enableVertexAttribArray(a_position); // enable a_position attribute

		// Initialize buffers for batching (20,000 sprites max)
		this.growBuffer(20000);

		// Create render-to-texture setup
		this.createRenderTexture(canvas.width, canvas.height);

		// Initialize performance state
		this.isPerformanceMeasurementMode = false;
	}

	/**
	 * Allocate new buffers for batching sprites
	 * @param newSize - Maximum number of sprites the buffer can hold
	 */
	growBuffer(newSize: number): void {
		// Each sprite = 2 triangles = 6 vertices = 12 floats (6 positions + 6 texture coords)
		this.bufferSize = newSize * 12; // 12 floats per sprite
		this.bufferPointer = 0;
		this.bufferCounter = 0;
		this.vertexBuffer = new Float32Array(this.bufferSize);
		this.textureCoordinateBuffer = new Float32Array(this.bufferSize);
	}

	/**
	 * Handle canvas resize - update viewport and shader resolution uniform
	 * @param width - New canvas width
	 * @param height - New canvas height
	 */
	resize(width: number, height: number): void {
		this.gl.viewport(0, 0, width, height); // update rendering area
		this.setUniform('u_resolution', width, height); // update vertex shader coordinate conversion

		// Recreate render texture with new size
		this.createRenderTexture(width, height);
	}

	/**
	 * Load sprite sheet texture and store dimensions for UV coordinate calculation
	 * @param image - Image containing all sprites
	 */
	loadSpriteSheet(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas): void {
		this.spriteSheet = createTexture(this.gl, image);
		this.spriteSheetWidth = image.width;
		this.spriteSheetHeight = image.height;
	}

	/**
	 * Low-level sprite drawing - specify exact pixel coordinates in sprite sheet
	 * @param x - Screen X position
	 * @param y - Screen Y position
	 * @param width - Rendered width
	 * @param height - Rendered height
	 * @param spriteX - X pixel in sprite sheet
	 * @param spriteY - Y pixel in sprite sheet
	 * @param spriteWidth - Width in sprite sheet
	 * @param spriteHeight - Height in sprite sheet
	 */
	drawSpriteFromCoordinates(
		x: number,
		y: number,
		width: number,
		height: number,
		spriteX: number,
		spriteY: number,
		spriteWidth: number = width,
		spriteHeight: number = height
	): void {
		// Auto-flush buffer if full (prevents overflow)
		if (this.bufferCounter + 12 > this.bufferSize) {
			this.renderVertexBuffer();
			this.bufferCounter = 0;
			this.bufferPointer = 0;
		}

		fillBufferWithRectangleVertices(this.vertexBuffer, this.bufferPointer, x, y, width, height);
		fillBufferWithSpriteCoordinates(
			this.textureCoordinateBuffer,
			this.bufferPointer,
			spriteX,
			spriteY,
			spriteWidth,
			spriteHeight,
			this.spriteSheetWidth,
			this.spriteSheetHeight
		);

		// Advance buffer pointer (12 floats = 6 vertices = 2 triangles)
		this.bufferCounter += 12;
		this.bufferPointer = this.bufferCounter;
	}

	/**
	 * Draw line with thickness using geometric calculation
	 * @param x1 - Start X coordinate
	 * @param y1 - Start Y coordinate
	 * @param x2 - End X coordinate
	 * @param y2 - End Y coordinate
	 * @param spriteX - X pixel in sprite sheet
	 * @param spriteY - Y pixel in sprite sheet
	 * @param spriteWidth - Width in sprite sheet
	 * @param spriteHeight - Height in sprite sheet
	 * @param thickness - Line thickness in pixels
	 */
	drawLineFromCoordinates(
		x1: number,
		y1: number,
		x2: number,
		y2: number,
		spriteX: number,
		spriteY: number,
		spriteWidth: number,
		spriteHeight: number,
		thickness: number
	): void {
		// Auto-flush buffer if full
		if (this.bufferCounter + 12 > this.bufferSize) {
			this.renderVertexBuffer();
			this.bufferCounter = 0;
			this.bufferPointer = 0;
		}

		// Generate line geometry using trigonometry (see buffer.ts for math)
		fillBufferWithLineVertices(this.vertexBuffer, this.bufferPointer, x1, y1, x2, y2, thickness);

		// Use sprite texture to fill the line shape
		fillBufferWithSpriteCoordinates(
			this.textureCoordinateBuffer,
			this.bufferPointer,
			spriteX,
			spriteY,
			spriteWidth,
			spriteHeight,
			this.spriteSheetWidth,
			this.spriteSheetHeight
		);

		this.bufferCounter += 12;
		this.bufferPointer = this.bufferCounter;
	}

	/**
	 * Upload batched vertex data to GPU and render all sprites in one draw call
	 */
	renderVertexBuffer(): void {
		// Bind sprite sheet texture for sprite rendering
		if (this.spriteSheet) {
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteSheet);
		}

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer); // make texture buffer active
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureCoordinateBuffer, this.gl.STATIC_DRAW); // copy Float32Array to GPU

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer); // switch to position buffer
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexBuffer, this.gl.STATIC_DRAW); // copy positions to GPU

		this.gl.drawArrays(this.gl.TRIANGLES, 0, Math.min(this.bufferCounter / 2, this.bufferSize / 2)); // render triangles from vertex 0

		// Force GPU sync for accurate performance measurement
		if (this.isPerformanceMeasurementMode) {
			this.gl.finish(); // blocks CPU until GPU rendering completes (slow!)
		}
	}

	/**
	 * Render sprites to texture, then apply post-processing to canvas
	 */
	renderWithPostProcessing(elapsedTime: number, shakeIntensity: number = 0.0, distortionIntensity: number = 0.2): void {
		// Phase 1: Render sprites to off-screen texture
		this.startRenderToTexture();
		this.renderVertexBuffer();
		this.endRenderToTexture();

		// Ensure all rendering to texture is complete
		this.gl.flush();

		// Explicitly unbind any textures before post-processing
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);

		// Phase 2: Render textured quad to canvas with post-effects
		this.renderPostProcess(elapsedTime, shakeIntensity, distortionIntensity);
	}

	/**
	 * Helper to set shader uniform values
	 * @param name - Uniform variable name in shader
	 * @param values - 1-4 numeric values to set
	 */
	setUniform(name: string, ...values: number[]): void {
		const location = this.gl.getUniformLocation(this.program, name);
		if (!location) {
			throw new Error(`Failed to get uniform location for: ${name}`);
		}

		// Call appropriate uniform function based on value count
		switch (values.length) {
			case 1:
				this.gl.uniform1f(location, values[0]); // single float (like time)
				break;
			case 2:
				this.gl.uniform2f(location, values[0], values[1]); // vec2 (like resolution)
				break;
			case 3:
				this.gl.uniform3f(location, values[0], values[1], values[2]); // vec3 (like RGB color)
				break;
			case 4:
				this.gl.uniform4f(location, values[0], values[1], values[2], values[3]); // vec4 (like RGBA color)
				break;
			default:
				throw new Error(`Unsupported uniform value count: ${values.length}`);
		}
	}

	clearScreen(): void {
		this.gl.clear(this.gl.COLOR_BUFFER_BIT); // fills with clearColor
	}

	updateTime(elapsedTime: number): void {
		if (this.timeLocation) {
			this.gl.uniform1f(this.timeLocation, elapsedTime); // upload single float to u_time uniform
		}
	}

	resetBuffers(): void {
		this.bufferPointer = 0; // Reset write position
		this.bufferCounter = 0; // Reset usage counter
	}

	getBufferStats(): { triangles: number; maxTriangles: number } {
		const triangles = this.bufferCounter / 2; // 2 triangles per sprite
		const maxTriangles = Math.floor(this.vertexBuffer.length / 2);
		return { triangles, maxTriangles };
	}

	/**
	 * Create framebuffer and texture for render-to-texture
	 */
	createRenderTexture(width: number, height: number): void {
		this.renderTextureWidth = width;
		this.renderTextureHeight = height;

		// Create texture to render into
		this.renderTexture = this.gl.createTexture()!;
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTexture);
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.RGBA,
			width,
			height,
			0,
			this.gl.RGBA,
			this.gl.UNSIGNED_BYTE,
			null
		);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		// Create framebuffer
		this.renderFramebuffer = this.gl.createFramebuffer()!;
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderFramebuffer);
		this.gl.framebufferTexture2D(
			this.gl.FRAMEBUFFER,
			this.gl.COLOR_ATTACHMENT0,
			this.gl.TEXTURE_2D,
			this.renderTexture,
			0
		);

		// Check framebuffer completeness
		if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
			throw new Error('Framebuffer not complete');
		}

		// Unbind framebuffer (render to canvas by default)
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}

	/**
	 * Start rendering to the off-screen texture
	 */
	startRenderToTexture(): void {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.renderFramebuffer);
		this.gl.viewport(0, 0, this.renderTextureWidth, this.renderTextureHeight);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}

	/**
	 * End rendering to texture and switch back to canvas
	 */
	endRenderToTexture(): void {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
	}

	/**
	 * Render post-process effects over the entire screen
	 */
	renderPostProcess(elapsedTime: number, shakeIntensity: number = 0.0, distortionIntensity: number = 0.2): void {
		// Make sure we're rendering to canvas, not framebuffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

		// Clear canvas for post-processing
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		// Switch to post-process shader program
		this.gl.useProgram(this.postProcessProgram);

		// Bind render texture
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.renderTexture);

		// Set uniforms
		if (this.postProcessTimeLocation) {
			this.gl.uniform1f(this.postProcessTimeLocation, elapsedTime);
		}
		if (this.postProcessResolutionLocation) {
			this.gl.uniform2f(this.postProcessResolutionLocation, this.gl.canvas.width, this.gl.canvas.height);
		}
		if (this.postProcessShakeIntensityLocation) {
			this.gl.uniform1f(this.postProcessShakeIntensityLocation, shakeIntensity);
		}
		if (this.postProcessDistortionIntensityLocation) {
			this.gl.uniform1f(this.postProcessDistortionIntensityLocation, distortionIntensity);
		}
		if (this.postProcessTextureLocation) {
			this.gl.uniform1i(this.postProcessTextureLocation, 0); // Use texture unit 0
		}

		// Get position attribute location for post-process shader
		const a_position = this.gl.getAttribLocation(this.postProcessProgram, 'a_position');

		// Bind full-screen quad and configure vertex attributes
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.postProcessPositionBuffer);
		this.gl.vertexAttribPointer(a_position, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(a_position);

		// Disable blending for direct texture rendering
		this.gl.disable(this.gl.BLEND);

		// Render full-screen quad as triangle strip
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

		// Re-enable blending for next frame
		this.gl.enable(this.gl.BLEND);
		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

		// Switch back to main shader program for next frame
		this.gl.useProgram(this.program);

		// Re-enable main shader attributes
		const main_a_position = this.gl.getAttribLocation(this.program, 'a_position');
		const main_a_texcoord = this.gl.getAttribLocation(this.program, 'a_texcoord');

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer);
		this.gl.vertexAttribPointer(main_a_position, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(main_a_position);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer);
		this.gl.vertexAttribPointer(main_a_texcoord, 2, this.gl.FLOAT, false, 0, 0);
		this.gl.enableVertexAttribArray(main_a_texcoord);
	}
}
