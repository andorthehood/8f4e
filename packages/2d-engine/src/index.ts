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

	/**
	 * Creates a new 2D rendering engine instance
	 * @param canvas - The HTML canvas element to render to
	 */
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

	/**
	 * Begin a transform group - all subsequent draws will be offset by (x, y)
	 * @param x - X offset to apply to all draws in this group
	 * @param y - Y offset to apply to all draws in this group
	 */
	startGroup(x: number, y: number): void {
		this.offsetX += x;
		this.offsetY += y;
		this.offsetGroups.push([x, y]);
	}

	/**
	 * End the current transform group - restore previous offset
	 */
	endGroup(): void {
		const coordinates = this.offsetGroups.pop();
		if (!coordinates) {
			throw new Error('No group to end');
		}
		const [x, y] = coordinates;
		this.offsetX -= x;
		this.offsetY -= y;
	}

	/**
	 * Allocate new buffers for batching sprites
	 * @param newSize - Maximum number of sprites the buffer can hold
	 */
	growBuffer(newSize: number): void {
		this.bufferSize = newSize * 12;
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
		this.gl.viewport(0, 0, width, height);
		this.setUniform('u_resolution', width, height);
	}

	/**
	 * Main render loop - calls user callback to populate buffers, then renders everything
	 * @param callback - Function called each frame to draw sprites
	 */
	render(callback: (timeToRender: number, fps: number, triangles: number, maxTriangles: number) => void): void {
		const triangles = this.bufferCounter / 2;
		const maxTriangles = Math.floor(this.vertexBuffer.length / 2);
		this.bufferPointer = 0;
		this.bufferCounter = 0;

		const fps = Math.floor(this.frameCounter / ((Date.now() - this.startTime) / 1000));
		const timeToRender = this.lastRenderFinishTime - this.lastRenderStartTime;

		this.lastRenderStartTime = performance.now();

		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		const elapsedTime = (Date.now() - this.startTime) / 1000;
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
		this.bufferPointer = this.bufferCounter;
	}

	/**
	 * Draw line with thickness using geometric calculation
	 * @param x1 - Start X coordinate
	 * @param y1 - Start Y coordinate
	 * @param x2 - End X coordinate
	 * @param y2 - End Y coordinate
	 * @param sprite - Sprite to use for line texture
	 * @param thickness - Line thickness in pixels
	 */
	drawLine(x1: number, y1: number, x2: number, y2: number, sprite: string | number, thickness: number): void {
		// Auto-flush buffer if full
		if (this.bufferCounter + 12 > this.bufferSize) {
			this.renderVertexBuffer();
			this.bufferCounter = 0;
			this.bufferPointer = 0;
		}

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
		this.bufferPointer = this.bufferCounter;
	}

	/**
	 * High-level sprite drawing - use sprite lookup by name/ID
	 * @param posX - Screen X position
	 * @param posY - Screen Y position
	 * @param sprite - Sprite name or ID from lookup table
	 * @param width - Optional custom width (uses sprite width if not specified)
	 * @param height - Optional custom height (uses sprite height if not specified)
	 */
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

	/**
	 * Upload batched vertex data to GPU and render all sprites in one draw call
	 */
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

	/**
	 * Set the sprite lookup table (maps names/IDs to sprite sheet coordinates)
	 * @param spriteLookup - Object mapping sprite keys to coordinates
	 */
	setSpriteLookup(spriteLookup: SpriteLookup): void {
		this.spriteLookup = spriteLookup;
	}

	/**
	 * Draw text using sprite font - each character is a sprite
	 * @param posX - Starting X position
	 * @param posY - Starting Y position
	 * @param text - Text string to render
	 * @param sprites - Optional per-character sprite lookup overrides
	 */
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
}
