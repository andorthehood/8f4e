import { Engine } from './engine';
import { CachedRenderer } from './CachedRenderer';

/**
 * Cached engine that extends base Engine with cache group functionality
 * Uses CachedRenderer for WebGL-level caching optimizations
 */
export class CachedEngine extends Engine {
	private cachedRenderer: CachedRenderer;
	private savedOffsetX: number | null = null;
	private savedOffsetY: number | null = null;

	constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
		super(canvas);
		
		// Replace renderer with cached version
		this.cachedRenderer = new CachedRenderer(canvas, maxCacheItems);
		// TypeScript requires accessing private field through bracket notation
		(this as unknown as { renderer: CachedRenderer }).renderer = this.cachedRenderer;
	}

	/**
	 * Start cache group - handle offset management and delegate to renderer
	 */
	startCacheGroup(cacheId: string, width: number, height: number): void {
		// Guard against nesting
		if (this.savedOffsetX !== null || this.savedOffsetY !== null) {
			throw new Error('Cannot nest cache groups');
		}

		const isCreatingNewCache = this.cachedRenderer.startCacheGroup(cacheId, width, height);

		// Only save and reset offsets when creating new cache
		if (isCreatingNewCache) {
			// Save current offsets and reset to (0,0) for cache creation
			this.savedOffsetX = this.offsetX;
			this.savedOffsetY = this.offsetY;
			this.offsetX = 0;
			this.offsetY = 0;
		}
	}

	/**
	 * End cache group - handle offset restoration and delegate to renderer
	 */
	endCacheGroup(): void {
		const cacheInfo = this.cachedRenderer.endCacheGroup();

		if (cacheInfo) {
			// If we were creating new cache, restore original offsets
			if (this.savedOffsetX !== null && this.savedOffsetY !== null) {
				this.offsetX = this.savedOffsetX;
				this.offsetY = this.savedOffsetY;
				this.savedOffsetX = null;
				this.savedOffsetY = null;
			}

			// Draw cached content to main canvas at current position
			this.cachedRenderer.drawCachedTexture(cacheInfo.texture, cacheInfo.width, cacheInfo.height);
		}
	}

	/**
	 * Cache management methods - delegate to CachedRenderer
	 */

	/**
	 * Clear specific cache entry
	 */
	clearCache(cacheId: string): void {
		this.cachedRenderer.clearCache(cacheId);
	}

	/**
	 * Clear all cached textures
	 */
	clearAllCaches(): void {
		this.cachedRenderer.clearAllCaches();
	}

	/**
	 * Set maximum number of cached items (triggers LRU eviction if exceeded)
	 */
	setMaxCacheItems(limit: number): void {
		this.cachedRenderer.setMaxCacheItems(limit);
	}

	/**
	 * Check if cache exists for given ID
	 */
	getCacheExists(cacheId: string): boolean {
		return this.cachedRenderer.getCacheExists(cacheId);
	}

	/**
	 * Get number of cached items
	 */
	getCacheCount(): number {
		return this.cachedRenderer.getCacheCount();
	}

	/**
	 * Get cache statistics including memory usage estimate
	 */
	getCacheStats(): { count: number; maxItems: number; memoryEstimate: number } {
		return this.cachedRenderer.getCacheStats();
	}

	/**
	 * Check if currently in a cache group
	 */
	getIsInCacheGroup(): boolean {
		return this.cachedRenderer.getIsInCacheGroup();
	}

	/**
	 * Get current cache ID (if in cache group)
	 */
	getCurrentCacheId(): string | null {
		return this.cachedRenderer.getCurrentCacheId();
	}
}