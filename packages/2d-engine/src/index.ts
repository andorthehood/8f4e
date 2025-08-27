import {
	fillBufferWithLineVertices,
	fillBufferWithRectangleVertices,
	fillBufferWithSpriteCoordinates,
} from './utils/buffer';
import createProgram from './utils/createProgram';
import createShader from './utils/createShader';
import createTexture from './utils/createTexture';
import textureShader from './shaders/fragmentShader';
import vertexShader from './shaders/vertexShader';

export type SpriteCoordinates = {
	spriteWidth: number;
	spriteHeight: number;
	x: number;
	y: number;
};

export type SpriteLookup = Record<string | number, SpriteCoordinates>;

export type RenderTexture = {
	texture: WebGLTexture;
	framebuffer: WebGLFramebuffer;
	width: number;
	height: number;
};

export class Engine {
	program: WebGLProgram;
	gl: WebGL2RenderingContext | WebGLRenderingContext;
	glPositionBuffer: WebGLBuffer;
	glTextureCoordinateBuffer: WebGLBuffer;
	vertexBuffer: Float32Array;
	bufferPointer: number;
	textureCoordinateBuffer: Float32Array;
	spriteSheet: WebGLTexture;
	spriteSheetWidth: number;
	spriteSheetHeight: number;
	frameCounter: number;
	startTime: number;
	lastRenderFinishTime: number;
	lastRenderStartTime: number;
	offsetX: number;
	offsetY: number;
	offsetGroups: number[][];
	bufferSize: number;
	bufferCounter: number;
	spriteLookup: SpriteLookup;
	timeLocation: WebGLUniformLocation | null;

	/**
	 * If enabled, it makes the render function block the main thread until the GPU finishes rendering.
	 * Otherwise rendering is asynchronous, and there's no other way to get notified of the end of it.
	 * It makes possible to measure the time a whole render cycle took.
	 */
	isPerformanceMeasurementMode: boolean;

	constructor(canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
		if (!gl) {
			throw new Error('Failed to get WebGL context');
		}
		this.gl = gl;

		this.program = createProgram(this.gl, [
			createShader(this.gl, textureShader, this.gl.FRAGMENT_SHADER),
			createShader(this.gl, vertexShader, this.gl.VERTEX_SHADER),
		]);

		const a_position = this.gl.getAttribLocation(this.program, 'a_position');
		const a_texcoord = this.gl.getAttribLocation(this.program, 'a_texcoord');
		this.timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
		this.glTextureCoordinateBuffer = this.gl.createBuffer();
		this.glPositionBuffer = this.gl.createBuffer();

		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
		this.gl.clearColor(0, 0, 0, 1.0);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.gl.useProgram(this.program);
		this.setUniform('u_resolution', canvas.width, canvas.height);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer);
		this.gl.vertexAttribPointer(a_position, 2, this.gl.FLOAT, false, 0, 0);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer);
		this.gl.vertexAttribPointer(a_texcoord, 2, this.gl.FLOAT, false, 0, 0);

		this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.gl.enable(this.gl.BLEND);

		this.gl.enableVertexAttribArray(a_texcoord);
		this.gl.enableVertexAttribArray(a_position);

		this.growBuffer(20000);

		this.startTime = Date.now();
		this.frameCounter = 0;
		this.isPerformanceMeasurementMode = false;
		this.offsetX = 0;
		this.offsetY = 0;
		this.offsetGroups = [];
	}

	startGroup(x: number, y: number): void {
		this.offsetX += x;
		this.offsetY += y;
		this.offsetGroups.push([x, y]);
	}

	endGroup(): void {
		const coordinates = this.offsetGroups.pop();
		if (!coordinates) {
			throw new Error('No group to end');
		}
		const [x, y] = coordinates;
		this.offsetX -= x;
		this.offsetY -= y;
	}

	growBuffer(newSize: number): void {
		this.bufferSize = newSize * 12;
		this.bufferPointer = 0;
		this.bufferCounter = 0;
		this.vertexBuffer = new Float32Array(this.bufferSize);
		this.textureCoordinateBuffer = new Float32Array(this.bufferSize);
	}

	resize(width: number, height: number): void {
		this.gl.viewport(0, 0, width, height);
		this.setUniform('u_resolution', width, height);
	}

	render(callback: (timeToRender: number, fps: number, triangles: number, maxTriangles: number) => void): void {
		const triangles = this.bufferCounter / 2;
		const maxTriangles = Math.floor(this.vertexBuffer.length / 2);
		this.bufferPointer = 0;
		this.bufferCounter = 0;

		const fps = Math.floor(this.frameCounter / ((Date.now() - this.startTime) / 1000));
		const timeToRender = this.lastRenderFinishTime - this.lastRenderStartTime;

		this.lastRenderStartTime = performance.now();

		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		const elapsedTime = (Date.now() - this.startTime) / 1000; // convert to seconds
		if (this.timeLocation) {
			this.gl.uniform1f(this.timeLocation, elapsedTime);
		}

		callback(timeToRender, fps, triangles, maxTriangles);

		this.renderVertexBuffer();

		this.lastRenderFinishTime = performance.now();
		this.frameCounter++;

		window.requestAnimationFrame(() => {
			this.render(callback);
		});
	}

	/**
	 * Fills the line drawing buffer with indices of a rectangle.
	 * @param x top left corner X coordinate
	 * @param y top left corner Y coordinate
	 * @param width width of the rectanlge
	 * @param height height of the reactanlge
	 */
	drawRectangle(x: number, y: number, width: number, height: number, sprite: string | number, thickness = 1): void {
		this.drawLine(x, y, x + width, y, sprite, thickness);
		this.drawLine(x + width, y, x + width, y + height, sprite, thickness);
		this.drawLine(x + width, y + height, x, y + height, sprite, thickness);
		this.drawLine(x, y + height, x, y, sprite, thickness);
	}

	loadSpriteSheet(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas): void {
		this.spriteSheet = createTexture(this.gl, image);
		this.spriteSheetWidth = image.width;
		this.spriteSheetHeight = image.height;
	}

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
		x = x + this.offsetX;
		y = y + this.offsetY;
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

		this.bufferCounter += 12;
		this.bufferPointer = this.bufferCounter % this.bufferSize;
	}

	drawLine(x1: number, y1: number, x2: number, y2: number, sprite: string | number, thickness: number): void {
		x1 = x1 + this.offsetX;
		y1 = y1 + this.offsetY;
		x2 = x2 + this.offsetX;
		y2 = y2 + this.offsetY;
		const { x, y, spriteWidth, spriteHeight } = this.spriteLookup[sprite];

		fillBufferWithLineVertices(this.vertexBuffer, this.bufferPointer, x1, y1, x2, y2, thickness);

		fillBufferWithSpriteCoordinates(
			this.textureCoordinateBuffer,
			this.bufferPointer,
			x,
			y,
			spriteWidth,
			spriteHeight,
			this.spriteSheetWidth,
			this.spriteSheetHeight
		);

		this.bufferCounter += 12;
		this.bufferPointer = this.bufferCounter % this.bufferSize;
	}

	drawSprite(posX: number, posY: number, sprite: string | number, width?: number, height?: number): void {
		if (!this.spriteLookup[sprite]) {
			return;
		}

		const { x, y, spriteWidth, spriteHeight } = this.spriteLookup[sprite];

		this.drawSpriteFromCoordinates(
			posX,
			posY,
			width || spriteWidth,
			height || spriteHeight,
			x,
			y,
			spriteWidth,
			spriteHeight
		);
	}

	renderVertexBuffer(): void {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureCoordinateBuffer, this.gl.STATIC_DRAW);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexBuffer, this.gl.STATIC_DRAW);

		this.gl.drawArrays(this.gl.TRIANGLES, 0, Math.min(this.bufferCounter / 2, this.bufferSize / 2));

		if (this.isPerformanceMeasurementMode) {
			this.gl.finish();
		}
	}

	setSpriteLookup(spriteLookup: SpriteLookup): void {
		this.spriteLookup = spriteLookup;
	}

	drawText(posX: number, posY: number, text: string, sprites?: Array<SpriteLookup | undefined>): void {
		for (let i = 0; i < text.length; i++) {
			if (sprites && sprites[i]) {
				const sprite = sprites[i];
				if (sprite) {
					this.spriteLookup = sprite;
				}
			}
			const spriteDef = this.spriteLookup[text[i]];
			if (!spriteDef) {
				continue; // Skip undefined sprites
			}
			const { x, y, spriteWidth, spriteHeight } = spriteDef;
			this.drawSpriteFromCoordinates(posX + i * spriteWidth, posY, spriteWidth, spriteHeight, x, y);
		}
	}

	setUniform(name: string, ...values: number[]): void {
		const location = this.gl.getUniformLocation(this.program, name);
		if (!location) {
			throw new Error(`Failed to get uniform location for: ${name}`);
		}
		switch (values.length) {
			case 1:
				this.gl.uniform1f(location, values[0]);
				break;
			case 2:
				this.gl.uniform2f(location, values[0], values[1]);
				break;
			case 3:
				this.gl.uniform3f(location, values[0], values[1], values[2]);
				break;
			case 4:
				this.gl.uniform4f(location, values[0], values[1], values[2], values[3]);
				break;
			default:
				throw new Error(`Unsupported uniform value count: ${values.length}`);
		}
	}

	/**
	 * Creates a render texture that can be used as an off-screen render target.
	 * @param width Width of the render texture
	 * @param height Height of the render texture
	 * @returns RenderTexture object containing texture and framebuffer references
	 */
	createRenderTexture(width: number, height: number): RenderTexture {
		// Create the texture
		const texture = this.gl.createTexture();
		if (!texture) {
			throw new Error('Failed to create render texture');
		}

		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

		// Create empty texture with specified dimensions
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

		// Set texture parameters for render target
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		// Create framebuffer
		const framebuffer = this.gl.createFramebuffer();
		if (!framebuffer) {
			this.gl.deleteTexture(texture);
			throw new Error('Failed to create framebuffer');
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

		// Check framebuffer completeness
		const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
		if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
			this.gl.deleteTexture(texture);
			this.gl.deleteFramebuffer(framebuffer);
			throw new Error(`Framebuffer not complete: ${status}`);
		}

		// Restore original bindings
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteSheet);

		return {
			texture,
			framebuffer,
			width,
			height,
		};
	}

	/**
	 * Renders content to a render texture using the provided callback.
	 * @param renderTexture The render texture to render to
	 * @param renderCallback Function that contains the drawing commands
	 */
	renderToTexture(renderTexture: RenderTexture, renderCallback: () => void): void {
		// Save current state
		const originalViewport = this.gl.getParameter(this.gl.VIEWPORT);

		// Switch to render texture framebuffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, renderTexture.framebuffer);
		this.gl.viewport(0, 0, renderTexture.width, renderTexture.height);

		// Clear the render texture
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		// Save current resolution uniform and update for render texture
		const originalResolution = [this.gl.canvas.width, this.gl.canvas.height];
		this.setUniform('u_resolution', renderTexture.width, renderTexture.height);

		// Execute the rendering callback
		renderCallback();

		// Render any pending vertices to the texture
		this.renderVertexBuffer();

		// Restore original state
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(originalViewport[0], originalViewport[1], originalViewport[2], originalViewport[3]);
		this.setUniform('u_resolution', originalResolution[0], originalResolution[1]);
	}

	/**
	 * Draws a texture as a single quad sprite.
	 * @param texture The WebGL texture to draw
	 * @param x X position to draw the texture
	 * @param y Y position to draw the texture
	 * @param width Width to draw the texture
	 * @param height Height to draw the texture
	 */
	drawTexture(texture: WebGLTexture, x: number, y: number, width: number, height: number): void {
		// Save current texture binding
		const currentTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);

		// Temporarily switch to the render texture
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

		// Save current sprite sheet dimensions
		const originalSheetWidth = this.spriteSheetWidth;
		const originalSheetHeight = this.spriteSheetHeight;

		// Temporarily set texture dimensions to 1x1 so that sprite coordinates 0,0,1,1
		// map to the full texture (0,0 to 1,1 in normalized coordinates)
		this.spriteSheetWidth = 1;
		this.spriteSheetHeight = 1;

		// Draw using full texture coordinates (0,0 to 1,1)
		this.drawSpriteFromCoordinates(
			x,
			y,
			width,
			height,
			0, // spriteX: 0
			0, // spriteY: 0
			1, // spriteWidth: 1 (full texture width)
			1 // spriteHeight: 1 (full texture height)
		);

		// Restore original texture binding and dimensions
		this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
		this.spriteSheetWidth = originalSheetWidth;
		this.spriteSheetHeight = originalSheetHeight;
	}

	/**
	 * Disposes of a render texture and its associated framebuffer to free GPU memory.
	 * @param renderTexture The render texture to dispose
	 */
	disposeRenderTexture(renderTexture: RenderTexture): void {
		if (renderTexture.texture) {
			this.gl.deleteTexture(renderTexture.texture);
		}
		if (renderTexture.framebuffer) {
			this.gl.deleteFramebuffer(renderTexture.framebuffer);
		}
	}
}
