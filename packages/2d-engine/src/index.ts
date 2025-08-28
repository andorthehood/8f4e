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

export type CachedTexture = {
	texture: WebGLTexture;
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

	// Texture cache related properties
	private textureCache: Map<string, CachedTexture>;
	private isInCacheBlock: boolean;
	private currentCacheId: string | null;
	private currentCacheCanvasX: number;
	private currentCacheCanvasY: number;
	private cacheFramebuffer: WebGLFramebuffer | null;
	private cacheTexture: WebGLTexture | null;
	private cacheWidth: number;
	private cacheHeight: number;
	private originalViewport: [number, number, number, number] | null;
	private originalFramebuffer: WebGLFramebuffer | null;
	private originalOffsetX: number;
	private originalOffsetY: number;

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

		// Initialize texture cache properties
		this.textureCache = new Map();
		this.isInCacheBlock = false;
		this.currentCacheId = null;
		this.currentCacheCanvasX = 0;
		this.currentCacheCanvasY = 0;
		this.cacheFramebuffer = null;
		this.cacheTexture = null;
		this.cacheWidth = 0;
		this.cacheHeight = 0;
		this.originalViewport = null;
		this.originalFramebuffer = null;
		this.originalOffsetX = 0;
		this.originalOffsetY = 0;
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

	startTextureCacheBlock(cacheId: string, width: number, height: number, x: number, y: number): void {
		if (this.isInCacheBlock) {
			throw new Error('Already in cache block. Call endTextureCacheBlock() first.');
		}

		// Implement offset behavior exactly like startGroup
		this.offsetX += x;
		this.offsetY += y;
		this.offsetGroups.push([x, y]);

		// Store cache parameters
		this.isInCacheBlock = true;
		this.currentCacheId = cacheId;
		this.currentCacheCanvasX = x;
		this.currentCacheCanvasY = y;

		// Store original offset (before any modifications)
		this.originalOffsetX = this.offsetX;
		this.originalOffsetY = this.offsetY;

		// Check if texture already exists in cache
		if (this.textureCache.has(cacheId)) {
			// Cache exists, no need to create new framebuffer
			return;
		}

		// Create new cache - set up WebGL framebuffer
		this.cacheWidth = width;
		this.cacheHeight = height;

		// Set offset to 0 for framebuffer rendering (start from top-left corner)
		this.offsetX = 0;
		this.offsetY = 0;

		// Store original WebGL state
		this.originalViewport = [
			this.gl.getParameter(this.gl.VIEWPORT)[0],
			this.gl.getParameter(this.gl.VIEWPORT)[1],
			this.gl.getParameter(this.gl.VIEWPORT)[2],
			this.gl.getParameter(this.gl.VIEWPORT)[3]
		];
		this.originalFramebuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);

		// Create framebuffer and texture for caching
		this.cacheFramebuffer = this.gl.createFramebuffer();
		this.cacheTexture = this.gl.createTexture();

		if (!this.cacheFramebuffer || !this.cacheTexture) {
			throw new Error('Failed to create cache framebuffer or texture');
		}

		// Set up the texture
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.cacheTexture);
		this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		// Set up the framebuffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.cacheFramebuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.cacheTexture, 0);

		// Check framebuffer completeness
		const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
		if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
			throw new Error('Cache framebuffer is not complete');
		}

		// Set viewport for cache dimensions and clear
		this.gl.viewport(0, 0, width, height);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		// Update resolution uniform for cache rendering
		this.setUniform('u_resolution', width, height);
	}

	endTextureCacheBlock(): void {
		if (!this.isInCacheBlock) {
			throw new Error('Not in cache block. Call startTextureCacheBlock() first.');
		}

		const cacheId = this.currentCacheId!;

		// Check if cache already exists
		if (this.textureCache.has(cacheId)) {
			// Cache exists - ignore all drawing operations and just draw cached texture
			// Restore original offset first
			this.offsetX = this.originalOffsetX;
			this.offsetY = this.originalOffsetY;
			
			// Implement offset behavior exactly like endGroup
			const coordinates = this.offsetGroups.pop();
			if (!coordinates) {
				throw new Error('No group to end');
			}
			const [x, y] = coordinates;
			this.offsetX -= x;
			this.offsetY -= y;
			
			this.isInCacheBlock = false;
			this.currentCacheId = null;
			
			// Ensure any pending operations are rendered to main framebuffer before drawing cached texture
			this.renderVertexBuffer();
			
			// Now safely draw the cached texture at current offset position
			this.drawCachedTextureAt(cacheId, this.offsetX + this.currentCacheCanvasX, this.offsetY + this.currentCacheCanvasY);
			return;
		}

		// Cache is new - finalize the cache creation
		if (!this.cacheFramebuffer || !this.cacheTexture) {
			throw new Error('Cache framebuffer or texture is null');
		}

		// Render any buffered operations to the framebuffer
		this.renderVertexBuffer();

		// Store the new texture in cache
		this.textureCache.set(cacheId, {
			texture: this.cacheTexture,
			width: this.cacheWidth,
			height: this.cacheHeight
		});

		// Restore original WebGL state before drawing cached texture
		this.restoreOriginalFramebufferContext();
		
		// Restore original offset
		this.offsetX = this.originalOffsetX;
		this.offsetY = this.originalOffsetY;

		// Implement offset behavior exactly like endGroup
		const coordinates = this.offsetGroups.pop();
		if (!coordinates) {
			throw new Error('No group to end');
		}
		const [x, y] = coordinates;
		this.offsetX -= x;
		this.offsetY -= y;

		// Ensure any pending operations are rendered to main framebuffer before drawing cached texture
		this.renderVertexBuffer();

		// Draw the cached texture at current offset position
		this.drawCachedTextureAt(cacheId, this.offsetX + this.currentCacheCanvasX, this.offsetY + this.currentCacheCanvasY);

		// Clean up cache resources
		this.cleanupCacheResources();

		// Reset cache state
		this.isInCacheBlock = false;
		this.currentCacheId = null;
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
		// If in cache mode and cache already exists, ignore drawing operations
		if (this.isInCacheBlock && this.currentCacheId && this.textureCache.has(this.currentCacheId)) {
			return;
		}

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
		// If in cache mode and cache already exists, ignore drawing operations
		if (this.isInCacheBlock && this.currentCacheId && this.textureCache.has(this.currentCacheId)) {
			return;
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
		this.bufferPointer = this.bufferCounter % this.bufferSize;
	}

	drawLine(x1: number, y1: number, x2: number, y2: number, sprite: string | number, thickness: number): void {
		// If in cache mode and cache already exists, ignore drawing operations
		if (this.isInCacheBlock && this.currentCacheId && this.textureCache.has(this.currentCacheId)) {
			return;
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
		this.bufferPointer = this.bufferCounter % this.bufferSize;
	}

	drawSprite(posX: number, posY: number, sprite: string | number, width?: number, height?: number): void {
		// If in cache mode and cache already exists, ignore drawing operations
		if (this.isInCacheBlock && this.currentCacheId && this.textureCache.has(this.currentCacheId)) {
			return;
		}

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
		// If in cache mode and cache already exists, ignore drawing operations
		if (this.isInCacheBlock && this.currentCacheId && this.textureCache.has(this.currentCacheId)) {
			return;
		}

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

	private restoreOriginalFramebufferContext(): void {
		// Restore original WebGL state
		if (this.originalFramebuffer !== null) {
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.originalFramebuffer);
		}
		if (this.originalViewport) {
			this.gl.viewport(this.originalViewport[0], this.originalViewport[1], this.originalViewport[2], this.originalViewport[3]);
			this.setUniform('u_resolution', this.originalViewport[2], this.originalViewport[3]);
		}
	}

	private drawCachedTextureAt(cacheId: string, x: number, y: number): void {
		const cachedTexture = this.textureCache.get(cacheId);
		if (!cachedTexture) {
			throw new Error(`Cached texture not found: ${cacheId}`);
		}

		// Store current texture state
		const originalTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);

		// Use immediate mode rendering to avoid feedback loops
		// Create a temporary buffer for just this cached texture
		const tempVertexBuffer = new Float32Array(12);
		const tempTextureCoordBuffer = new Float32Array(12);

		const actualX = x;
		const actualY = y;
		
		// Fill temporary buffers for the cached texture quad
		fillBufferWithRectangleVertices(
			tempVertexBuffer, 
			0, 
			actualX, 
			actualY, 
			cachedTexture.width, 
			cachedTexture.height
		);
		fillBufferWithSpriteCoordinates(
			tempTextureCoordBuffer,
			0,
			0, 0,
			cachedTexture.width, cachedTexture.height,
			cachedTexture.width, cachedTexture.height
		);

		// Bind the cached texture
		this.gl.bindTexture(this.gl.TEXTURE_2D, cachedTexture.texture);

		// Upload temporary buffers and render immediately
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, tempTextureCoordBuffer, this.gl.STATIC_DRAW);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, tempVertexBuffer, this.gl.STATIC_DRAW);

		// Render the cached texture immediately
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

		// Restore original texture binding (sprite sheet)
		this.gl.bindTexture(this.gl.TEXTURE_2D, originalTexture);
	}

	private cleanupCacheResources(): void {
		this.cacheFramebuffer = null;
		this.cacheTexture = null;
		this.cacheWidth = 0;
		this.cacheHeight = 0;
		this.originalViewport = null;
		this.originalFramebuffer = null;
	}

	deleteCachedTexture(cacheId: string): void {
		const cachedTexture = this.textureCache.get(cacheId);
		if (cachedTexture) {
			this.gl.deleteTexture(cachedTexture.texture);
			this.textureCache.delete(cacheId);
		}
	}

	clearTextureCache(): void {
		for (const [cacheId, cachedTexture] of this.textureCache) {
			this.gl.deleteTexture(cachedTexture.texture);
		}
		this.textureCache.clear();
	}
}
