import { Engine } from './engine';
import { CachedRenderer } from './CachedRenderer';

/**
 * CachedEngine extends the base Engine to use CachedRenderer for improved performance
 * when drawing complex or frequently-used content.
 */
export class CachedEngine extends Engine {
	private cachedRenderer: CachedRenderer;
	private savedOffsetX: number | null = null;
	private savedOffsetY: number | null = null;

	constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
		super(canvas);

		// Replace renderer with cached version
		this.cachedRenderer = new CachedRenderer(canvas, maxCacheItems);
		// @ts-expect-error - accessing private property to replace renderer
		this.renderer = this.cachedRenderer;
	}

	/**
	 * Start a cache group - subsequent drawing operations will be cached
	 * @param cacheId - Unique identifier for this cache group
	 * @param width - Width of the cache area
	 * @param height - Height of the cache area
	 * @returns true if cache was created/started, false if cache already exists
	 */
	startCacheGroup(cacheId: string, width: number, height: number): boolean {
		// Save current offset state
		this.savedOffsetX = this.offsetX;
		this.savedOffsetY = this.offsetY;

		// Reset offsets to (0,0) for cache creation
		this.offsetX = 0;
		this.offsetY = 0;

		return this.cachedRenderer.startCacheGroup(cacheId, width, height);
	}

	/**
	 * End the current cache group
	 * @returns Cache data if successful, null if no cache group was active
	 */
	endCacheGroup(): { texture: WebGLTexture; width: number; height: number } | null {
		const result = this.cachedRenderer.endCacheGroup();

		// Restore original offset state
		if (this.savedOffsetX !== null && this.savedOffsetY !== null) {
			this.offsetX = this.savedOffsetX;
			this.offsetY = this.savedOffsetY;
			this.savedOffsetX = null;
			this.savedOffsetY = null;
		}

		return result;
	}

	/**
	 * Draw cached content at specified position
	 * @param cacheId - ID of the cached content to draw
	 * @param x - X position to draw at
	 * @param y - Y position to draw at
	 */
	drawCachedContent(cacheId: string, x: number, y: number): void {
		if (!this.cachedRenderer.hasCachedContent(cacheId)) {
			return; // Cache doesn't exist, skip silently
		}

		// Apply transform offsets
		x = x + this.offsetX;
		y = y + this.offsetY;

		// Get cache data
		const cacheData = this.cachedRenderer.getCachedData(cacheId);

		if (cacheData) {
			this.cachedRenderer.drawCachedTexture(cacheData.texture, cacheData.width, cacheData.height, x, y);
		}
	}

	/**
	 * Check if cached content exists
	 * @param cacheId - ID to check
	 */
	hasCachedContent(cacheId: string): boolean {
		return this.cachedRenderer.hasCachedContent(cacheId);
	}

	/**
	 * Clear a specific cache entry
	 * @param cacheId - ID of the cache to clear
	 */
	clearCache(cacheId: string): void {
		this.cachedRenderer.clearCache(cacheId);
	}

	/**
	 * Clear all cache entries
	 */
	clearAllCache(): void {
		this.cachedRenderer.clearAllCache();
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { itemCount: number; maxItems: number; accessOrder: string[] } {
		return this.cachedRenderer.getCacheStats();
	}
}
