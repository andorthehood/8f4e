import { Engine } from './engine';
import { CachedRenderer } from './CachedRenderer';

/**
 * CachedEngine extends the base Engine to use CachedRenderer for improved performance
 * when drawing complex or frequently-used content.
 */
export class CachedEngine extends Engine {
	private savedOffsetX: number | null = null;
	private savedOffsetY: number | null = null;

	constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
		super(canvas);

		// Replace renderer with cached version
		// @ts-expect-error - accessing private property to replace renderer
		this.renderer = new CachedRenderer(canvas, maxCacheItems);
	}

	/**
	 * Convenience wrapper for caching a drawing block.
	 * Executes the callback only when a new cache is created; otherwise draws the cached content.
	 * Returns true when a new cache was created (callback ran), false when existing cache was used.
	 */
	cacheGroup(cacheId: string, width: number, height: number, draw: () => void): boolean {
		// Save and reset offsets for cache-local coordinates
		this.savedOffsetX = this.offsetX;
		this.savedOffsetY = this.offsetY;
		this.offsetX = 0;
		this.offsetY = 0;

		// @ts-expect-error - accessing private property to call cached renderer methods
		const created = (this.renderer as CachedRenderer).startCacheGroup(cacheId, width, height);

		if (!created) {
			// Restore offsets and draw cached content immediately
			this.offsetX = this.savedOffsetX || 0;
			this.offsetY = this.savedOffsetY || 0;
			this.savedOffsetX = null;
			this.savedOffsetY = null;
			this.drawCachedContent(cacheId, 0, 0);
			return false;
		}

		try {
			draw();
		} finally {
			// @ts-expect-error - accessing private property to call cached renderer methods
			(this.renderer as CachedRenderer).endCacheGroup();
			// Restore offsets
			if (this.savedOffsetX !== null && this.savedOffsetY !== null) {
				this.offsetX = this.savedOffsetX;
				this.offsetY = this.savedOffsetY;
				this.savedOffsetX = null;
				this.savedOffsetY = null;
			}
		}

		return true;
	}

	/**
	 * Draw cached content at specified position
	 * @param cacheId - ID of the cached content to draw
	 * @param x - X position to draw at
	 * @param y - Y position to draw at
	 */
	drawCachedContent(cacheId: string, x: number, y: number): void {
		// @ts-expect-error - accessing private property to call cached renderer methods
		if (!(this.renderer as CachedRenderer).hasCachedContent(cacheId)) {
			return; // Cache doesn't exist, skip silently
		}

		// Apply transform offsets
		x = x + this.offsetX;
		y = y + this.offsetY;

		// Get cache data
		// @ts-expect-error - accessing private property to call cached renderer methods
		const cacheData = (this.renderer as CachedRenderer).getCachedData(cacheId);

		if (cacheData) {
			// @ts-expect-error - accessing private property to call cached renderer methods
			(this.renderer as CachedRenderer).drawCachedTexture(cacheData.texture, cacheData.width, cacheData.height, x, y);
		}
	}

	/**
	 * Check if cached content exists
	 * @param cacheId - ID to check
	 */
	hasCachedContent(cacheId: string): boolean {
		// @ts-expect-error - accessing private property to call cached renderer methods
		return (this.renderer as CachedRenderer).hasCachedContent(cacheId);
	}

	/**
	 * Clear a specific cache entry
	 * @param cacheId - ID of the cache to clear
	 */
	clearCache(cacheId: string): void {
		// @ts-expect-error - accessing private property to call cached renderer methods
		(this.renderer as CachedRenderer).clearCache(cacheId);
	}

	/**
	 * Clear all cache entries
	 */
	clearAllCache(): void {
		// @ts-expect-error - accessing private property to call cached renderer methods
		(this.renderer as CachedRenderer).clearAllCache();
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { itemCount: number; maxItems: number; accessOrder: string[] } {
		// @ts-expect-error - accessing private property to call cached renderer methods
		return (this.renderer as CachedRenderer).getCacheStats();
	}
}
