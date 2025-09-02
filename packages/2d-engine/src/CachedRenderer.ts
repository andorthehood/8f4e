import { Renderer } from './renderer';
import { CacheManager } from './CacheManager';

/**
 * Cached renderer that extends base Renderer with cache group functionality
 * Overrides drawing methods to respect cache state for performance optimization
 */
export class CachedRenderer extends Renderer {
	private cacheManager: CacheManager;
	private savedViewport: Int32Array | null = null;
	private savedFramebuffer: WebGLFramebuffer | null = null;

	constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
		super(canvas);
		this.cacheManager = new CacheManager(this.gl, maxCacheItems);
	}

	/**
	 * Override sprite drawing to respect cache state
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
		// Skip drawing if we're using an existing cache
		if (this.cacheManager.shouldSkipDrawing()) {
			return;
		}

		// Delegate to parent implementation
		super.drawSpriteFromCoordinates(x, y, width, height, spriteX, spriteY, spriteWidth, spriteHeight);
	}

	/**
	 * Override line drawing to respect cache state
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
		// Skip drawing if we're using an existing cache
		if (this.cacheManager.shouldSkipDrawing()) {
			return;
		}

		// Delegate to parent implementation
		super.drawLineFromCoordinates(x1, y1, x2, y2, spriteX, spriteY, spriteWidth, spriteHeight, thickness);
	}

	/**
	 * Start cache group - switch to framebuffer rendering if creating new cache
	 */
	startCacheGroup(cacheId: string, width: number, height: number): boolean {
		const isCreatingNewCache = this.cacheManager.startCacheGroup(cacheId, width, height);

		if (isCreatingNewCache) {
			// Switch to framebuffer rendering
			this.switchToFramebufferRendering(width, height);
		}

		return isCreatingNewCache;
	}

	/**
	 * End cache group - restore main canvas rendering and draw cached texture
	 */
	endCacheGroup(): { texture: WebGLTexture; width: number; height: number } | null {
		const cacheInfo = this.cacheManager.endCacheGroup();

		if (cacheInfo) {
			// If we were creating new cache, restore main canvas rendering
			if (this.savedViewport && this.savedFramebuffer !== undefined) {
				this.restoreMainCanvasRendering();
			}
		}

		return cacheInfo;
	}

	/**
	 * Draw cached texture to current render target
	 */
	drawCachedTexture(texture: WebGLTexture, width: number, height: number): void {
		// Ensure all pending operations are rendered before drawing cached texture
		this.renderVertexBuffer();

		// Save current WebGL state
		const currentTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
		const currentProgram = this.gl.getParameter(this.gl.CURRENT_PROGRAM);

		// Create a simple quad to render the cached texture
		// Using the existing vertex buffer system for consistency
		const savedBufferCounter = this.bufferCounter;
		const savedBufferPointer = this.bufferPointer;

		// Reset buffer for texture quad
		this.bufferCounter = 0;
		this.bufferPointer = 0;

		// Add a full-screen quad using cached texture
		// This uses the sprite rendering system but with the cached texture
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

		// Draw quad using sprite coordinates (0,0 to width,height)
		super.drawSpriteFromCoordinates(0, 0, width, height, 0, 0, width, height);

		// Render the cached texture
		this.renderVertexBuffer();

		// Restore original buffer state
		this.bufferCounter = savedBufferCounter;
		this.bufferPointer = savedBufferPointer;

		// Restore WebGL state
		this.gl.bindTexture(this.gl.TEXTURE_2D, currentTexture);
		this.gl.useProgram(currentProgram);
	}

	/**
	 * Switch rendering to framebuffer for cache creation
	 */
	private switchToFramebufferRendering(width: number, height: number): void {
		const framebuffer = this.cacheManager.getCurrentCacheFramebuffer();
		if (!framebuffer) {
			throw new Error('No framebuffer available for cache rendering');
		}

		// Save current viewport and framebuffer
		this.savedViewport = this.gl.getParameter(this.gl.VIEWPORT);
		this.savedFramebuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);

		// Ensure any pending rendering is completed first
		this.renderVertexBuffer();

		// Switch to framebuffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
		this.gl.viewport(0, 0, width, height);

		// Clear the framebuffer
		this.gl.clearColor(0.0, 0.0, 0.0, 0.0); // Transparent
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	}

	/**
	 * Restore rendering to main canvas
	 */
	private restoreMainCanvasRendering(): void {
		if (!this.savedViewport) {
			throw new Error('No saved viewport to restore');
		}

		// Ensure framebuffer rendering is completed
		this.renderVertexBuffer();

		// Restore original framebuffer and viewport
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.savedFramebuffer);
		this.gl.viewport(this.savedViewport[0], this.savedViewport[1], this.savedViewport[2], this.savedViewport[3]);

		// Clear saved state
		this.savedViewport = null;
		this.savedFramebuffer = null;

		// Restore original clear color (if needed)
		this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Opaque
	}

	/**
	 * Cache management methods - delegate to CacheManager
	 */

	clearCache(cacheId: string): void {
		this.cacheManager.clearCache(cacheId);
	}

	clearAllCaches(): void {
		this.cacheManager.clearAllCaches();
	}

	setMaxCacheItems(limit: number): void {
		this.cacheManager.setMaxCacheItems(limit);
	}

	getCacheExists(cacheId: string): boolean {
		return this.cacheManager.getCacheExists(cacheId);
	}

	getCacheCount(): number {
		return this.cacheManager.getCacheCount();
	}

	getCacheStats(): { count: number; maxItems: number; memoryEstimate: number } {
		return this.cacheManager.getCacheStats();
	}

	getIsInCacheGroup(): boolean {
		return this.cacheManager.getIsInCacheGroup();
	}

	getCurrentCacheId(): string | null {
		return this.cacheManager.getCurrentCacheId();
	}
}