import { Renderer } from './renderer';
import { CachedRenderer } from './CachedRenderer';

import type { SpriteLookup, EngineOptions } from './types';
import type { PostProcessEffect } from './types/postProcess';

/**
 * High-level 2D engine - provides convenient drawing methods using sprite lookup
 */
export class Engine {
	private renderer: Renderer;
	private readonly cachingEnabled: boolean;

	// Cache-related state (only used when caching is enabled)
	private savedOffsetX: number | null = null;
	private savedOffsetY: number | null = null;

	// Performance tracking
	frameCounter: number;
	startTime: number;
	lastRenderFinishTime: number;
	lastRenderStartTime: number;

	// Transform system (for grouping sprites with relative positioning)
	offsetX: number;
	offsetY: number;
	offsetGroups: number[][];

	// Sprite lookup system
	spriteLookup: SpriteLookup;

	/**
	 * Creates a new 2D rendering engine instance
	 * @param canvas - The HTML canvas element to render to
	 * @param options - Optional configuration including caching settings
	 */
	constructor(canvas: HTMLCanvasElement, options?: EngineOptions) {
		this.cachingEnabled = options?.caching ?? false;

		if (this.cachingEnabled) {
			this.renderer = new CachedRenderer(canvas, options?.maxCacheItems ?? 50);
		} else {
			this.renderer = new Renderer(canvas);
		}

		// Initialize performance tracking and transform state
		this.startTime = Date.now();
		this.frameCounter = 0;
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
		this.offsetGroups.push([x, y]); // Save offset for endGroup()
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
		this.offsetX -= x; // Undo the offset from startGroup
		this.offsetY -= y;
	}

	/**
	 * Allocate new buffers for batching sprites
	 * @param newSize - Maximum number of sprites the buffer can hold
	 */
	growBuffer(newSize: number): void {
		this.renderer.growBuffer(newSize);
	}

	/**
	 * Handle canvas resize - update viewport and shader resolution uniform
	 * @param width - New canvas width
	 * @param height - New canvas height
	 */
	resize(width: number, height: number): void {
		this.renderer.resize(width, height);
	}

	/**
	 * Main render loop - calls user callback to populate buffers, then renders everything
	 * @param callback - Function called each frame to draw sprites
	 */
	render(callback: (timeToRender: number, fps: number, triangles: number, maxTriangles: number) => void): void {
		// Calculate performance stats and reset buffers for new frame
		const { triangles, maxTriangles } = this.renderer.getBufferStats();
		this.renderer.resetBuffers();

		// Calculate FPS and frame timing
		const fps = Math.floor(this.frameCounter / ((Date.now() - this.startTime) / 1000));
		const timeToRender = this.lastRenderFinishTime - this.lastRenderStartTime;

		this.lastRenderStartTime = performance.now();

		// Clear screen for new frame
		this.renderer.clearScreen();

		// Update time uniform for shader effects (like animations)
		const elapsedTime = (Date.now() - this.startTime) / 1000; // convert to seconds
		this.renderer.updateTime(elapsedTime);

		// Let user code draw sprites (fills the buffers)
		callback(timeToRender, fps, triangles, maxTriangles);

		// Render sprites to texture, then apply post-processing effects
		this.renderer.renderWithPostProcessing(elapsedTime);

		// Update performance tracking and schedule next frame
		this.lastRenderFinishTime = performance.now();
		this.frameCounter++;

		// Continue render loop
		window.requestAnimationFrame(() => {
			this.render(callback);
		});
	}

	/**
	 * Draw rectangle outline using 4 lines
	 * @param x - Top left X coordinate
	 * @param y - Top left Y coordinate
	 * @param width - Rectangle width
	 * @param height - Rectangle height
	 * @param sprite - Sprite to use for line texture
	 * @param thickness - Line thickness in pixels
	 */
	drawRectangle(x: number, y: number, width: number, height: number, sprite: string | number, thickness = 1): void {
		this.drawLine(x, y, x + width, y, sprite, thickness);
		this.drawLine(x + width, y, x + width, y + height, sprite, thickness);
		this.drawLine(x + width, y + height, x, y + height, sprite, thickness);
		this.drawLine(x, y + height, x, y, sprite, thickness);
	}

	/**
	 * Load sprite sheet texture and store dimensions for UV coordinate calculation
	 * @param image - Image containing all sprites
	 */
	loadSpriteSheet(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas): void {
		this.renderer.loadSpriteSheet(image);
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
		// Apply transform group offsets
		x = x + this.offsetX;
		y = y + this.offsetY;

		this.renderer.drawSpriteFromCoordinates(x, y, width, height, spriteX, spriteY, spriteWidth, spriteHeight);
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
		// Apply transform offsets
		x1 = x1 + this.offsetX;
		y1 = y1 + this.offsetY;
		x2 = x2 + this.offsetX;
		y2 = y2 + this.offsetY;

		// Get sprite texture coordinates for line appearance
		const { x, y, spriteWidth, spriteHeight } = this.spriteLookup[sprite];

		this.renderer.drawLineFromCoordinates(x1, y1, x2, y2, x, y, spriteWidth, spriteHeight, thickness);
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
			return; // Skip unknown sprites silently
		}

		// Get sprite coordinates from lookup table
		const { x, y, spriteWidth, spriteHeight } = this.spriteLookup[sprite];

		// Delegate to low-level drawing function
		this.drawSpriteFromCoordinates(
			posX,
			posY,
			width || spriteWidth, // Use custom size or default
			height || spriteHeight,
			x, // Sprite sheet coordinates
			y,
			spriteWidth, // Original sprite size
			spriteHeight
		);
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
		// Draw each character as a sprite, positioned side by side
		for (let i = 0; i < text.length; i++) {
			// Allow per-character sprite lookup override
			if (sprites && sprites[i]) {
				const sprite = sprites[i];
				if (sprite) {
					this.spriteLookup = sprite; // Temporarily switch lookup table
				}
			}

			// Look up character sprite (e.g., 'A' -> sprite coordinates)
			const spriteDef = this.spriteLookup[text[i]];
			if (!spriteDef) {
				continue; // Skip undefined characters
			}

			// Draw character sprite at calculated position
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
		this.renderer.setUniform(name, ...values);
	}

	/**
	 * Get/set performance measurement mode
	 */
	get isPerformanceMeasurementMode(): boolean {
		return this.renderer.isPerformanceMeasurementMode;
	}

	set isPerformanceMeasurementMode(value: boolean) {
		this.renderer.isPerformanceMeasurementMode = value;
	}

	/**
	 * Add a post-process effect to the rendering pipeline
	 */
	addPostProcessEffect(effect: PostProcessEffect): void {
		this.renderer.addPostProcessEffect(effect);
	}

	/**
	 * Remove a post-process effect from the pipeline
	 */
	removePostProcessEffect(name: string): void {
		this.renderer.removePostProcessEffect(name);
	}

	/**
	 * Remove all post-process effects from the pipeline
	 */
	removeAllPostProcessEffects(): void {
		this.renderer.removeAllPostProcessEffects();
	}

	/**
	 * Update uniform values in the post-process buffer
	 */
	updatePostProcessUniforms(uniforms: Record<string, number | number[]>): void {
		this.renderer.updatePostProcessUniforms(uniforms);
	}

	/**
	 * Enable or disable a post-process effect
	 */
	setPostProcessEffectEnabled(name: string, enabled: boolean): void {
		this.renderer.setPostProcessEffectEnabled(name, enabled);
	}

	/**
	 * Get direct access to the post-process uniform buffer
	 */
	getPostProcessBuffer(): Float32Array {
		return this.renderer.getPostProcessBuffer();
	}

	// Caching methods (only available when caching is enabled)

	/**
	 * Convenience wrapper for caching a drawing block.
	 * Only available when caching is enabled in constructor options.
	 * Executes the callback only when a new cache is created; otherwise draws the cached content.
	 * Returns true when a new cache was created (callback ran), false when existing cache was used.
	 * @param cacheId - Unique identifier for the cache
	 * @param width - Cache width in pixels
	 * @param height - Cache height in pixels
	 * @param draw - Drawing callback executed when creating cache
	 * @param enabled - Whether caching is enabled for this call (defaults to true)
	 */
	cacheGroup(cacheId: string, width: number, height: number, draw: () => void, enabled: boolean = true): boolean {
		if (!this.cachingEnabled) {
			// Caching not enabled: just draw with existing offsets
			draw();
			return false; // signal no cache was created/used
		}

		if (!enabled) {
			// Caching disabled for this call: just draw with existing offsets.
			// Do not read, create, or update any cache entries.
			draw();
			return false; // signal no cache was created/used
		}

		const cachedRenderer = this.renderer as CachedRenderer;

		// If cache exists, just draw it at current offset
		if (cachedRenderer.hasCachedContent(cacheId)) {
			this.drawCachedContent(cacheId, 0, 0);
			return false;
		}

		// Save and reset offsets for cache-local coordinates (creation path)
		this.savedOffsetX = this.offsetX;
		this.savedOffsetY = this.offsetY;
		this.offsetX = 0;
		this.offsetY = 0;

		const created = cachedRenderer.cacheGroup(cacheId, width, height, draw);

		// Restore offsets
		if (this.savedOffsetX !== null && this.savedOffsetY !== null) {
			this.offsetX = this.savedOffsetX;
			this.offsetY = this.savedOffsetY;
			this.savedOffsetX = null;
			this.savedOffsetY = null;
		}

		return created;
	}

	/**
	 * Draw cached content at specified position.
	 * Only available when caching is enabled in constructor options.
	 * @param cacheId - ID of the cached content to draw
	 * @param x - X position to draw at
	 * @param y - Y position to draw at
	 */
	drawCachedContent(cacheId: string, x: number, y: number): void {
		if (!this.cachingEnabled) {
			return; // Exit silently when caching is not enabled
		}

		const cachedRenderer = this.renderer as CachedRenderer;

		if (!cachedRenderer.hasCachedContent(cacheId)) {
			return; // Cache doesn't exist, skip silently
		}

		// Apply transform offsets
		x = x + this.offsetX;
		y = y + this.offsetY;

		// Get cache data
		const cacheData = cachedRenderer.getCachedData(cacheId);

		if (cacheData) {
			cachedRenderer.drawCachedTexture(cacheData.texture, cacheData.width, cacheData.height, x, y);
		}
	}

	/**
	 * Check if cached content exists.
	 * Only available when caching is enabled in constructor options.
	 * @param cacheId - ID to check
	 */
	hasCachedContent(cacheId: string): boolean {
		if (!this.cachingEnabled) {
			return false;
		}

		const cachedRenderer = this.renderer as CachedRenderer;
		return cachedRenderer.hasCachedContent(cacheId);
	}

	/**
	 * Clear a specific cache entry.
	 * Only available when caching is enabled in constructor options.
	 * @param cacheId - ID of the cache to clear
	 */
	clearCache(cacheId: string): void {
		if (!this.cachingEnabled) {
			return;
		}

		const cachedRenderer = this.renderer as CachedRenderer;
		cachedRenderer.clearCache(cacheId);
	}

	/**
	 * Clear all cache entries.
	 * Only available when caching is enabled in constructor options.
	 */
	clearAllCache(): void {
		if (!this.cachingEnabled) {
			return;
		}

		const cachedRenderer = this.renderer as CachedRenderer;
		cachedRenderer.clearAllCache();
	}

	/**
	 * Get cache statistics.
	 * Only available when caching is enabled in constructor options.
	 */
	getCacheStats(): { itemCount: number; maxItems: number; accessOrder: string[] } {
		if (!this.cachingEnabled) {
			return { itemCount: 0, maxItems: 0, accessOrder: [] };
		}

		const cachedRenderer = this.renderer as CachedRenderer;
		return cachedRenderer.getCacheStats();
	}

	/**
	 * Check if caching is enabled for this engine instance
	 */
	get isCachingEnabled(): boolean {
		return this.cachingEnabled;
	}
}
