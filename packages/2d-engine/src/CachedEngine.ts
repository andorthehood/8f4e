import { Engine } from './engine';
import { CachedRenderer } from './CachedRenderer';

/**
 * CachedEngine extends the base Engine to use CachedRenderer for improved performance
 * when drawing complex or frequently-used content.
 */
export class CachedEngine extends Engine {
	private savedOffsetX: number | null = null;
	private savedOffsetY: number | null = null;
	private cacheGroupStarted: boolean = false;

	constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
		super(canvas);

		// Replace renderer with cached version
		// @ts-expect-error - accessing private property to replace renderer
		this.renderer = new CachedRenderer(canvas, maxCacheItems);
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

		// @ts-expect-error - accessing private property to call cached renderer methods
		const result = (this.renderer as CachedRenderer).startCacheGroup(cacheId, width, height);
		this.cacheGroupStarted = result; // Track if we actually started a new cache group
		
		// If cache already exists, restore offsets immediately
		if (!result) {
			this.offsetX = this.savedOffsetX || 0;
			this.offsetY = this.savedOffsetY || 0;
			this.savedOffsetX = null;
			this.savedOffsetY = null;
		}
		
		return result;
	}

	/**
	 * End the current cache group
	 * @returns Cache data if successful, null if no cache group was active
	 */
	endCacheGroup(): { texture: WebGLTexture; width: number; height: number } | null {
		// Only end cache group if we actually started one
		if (!this.cacheGroupStarted) {
			return null; // No cache group was started, so nothing to end
		}
		
		// @ts-expect-error - accessing private property to call cached renderer methods
		const result = (this.renderer as CachedRenderer).endCacheGroup();

		// Restore original offset state
		if (this.savedOffsetX !== null && this.savedOffsetY !== null) {
			this.offsetX = this.savedOffsetX;
			this.offsetY = this.savedOffsetY;
			this.savedOffsetX = null;
			this.savedOffsetY = null;
		}

		this.cacheGroupStarted = false; // Reset flag
		return result;
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
