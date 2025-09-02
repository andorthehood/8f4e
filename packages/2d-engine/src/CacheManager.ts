/**
 * Pure cache management logic for 2D engine caching system
 * Handles WebGL framebuffers, textures, and LRU eviction
 */
export class CacheManager {
	private gl: WebGL2RenderingContext | WebGLRenderingContext;
	private cacheMap: Map<string, WebGLTexture>;
	private cacheFramebuffers: Map<string, WebGLFramebuffer>;
	private cacheSizes: Map<string, { width: number; height: number }>;
	private cacheAccessOrder: string[]; // For LRU tracking
	private maxCacheItems: number;

	// Current cache state
	private isInCacheGroup: boolean;
	private currentCacheId: string | null;
	private isUsingExistingCache: boolean; // Track if we're reusing existing cache

	constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, maxCacheItems: number = 50) {
		this.gl = gl;
		this.cacheMap = new Map();
		this.cacheFramebuffers = new Map();
		this.cacheSizes = new Map();
		this.cacheAccessOrder = [];
		this.maxCacheItems = maxCacheItems;
		this.isInCacheGroup = false;
		this.currentCacheId = null;
		this.isUsingExistingCache = false;
	}

	/**
	 * Start a cache group - returns true if creating new cache, false if using existing
	 */
	startCacheGroup(cacheId: string, width: number, height: number): boolean {
		// Guard against nesting
		if (this.isInCacheGroup) {
			throw new Error('Cannot nest cache groups');
		}

		this.isInCacheGroup = true;
		this.currentCacheId = cacheId;

		// Check if cache exists
		if (this.cacheMap.has(cacheId)) {
			// Cache exists - update access order and skip drawing operations
			this.updateCacheAccess(cacheId);
			this.isUsingExistingCache = true;
			return false; // Using existing cache
		}

		// Create new cache first
		const { framebuffer, texture } = this.createCacheFramebuffer(width, height);
		this.cacheFramebuffers.set(cacheId, framebuffer);
		this.cacheMap.set(cacheId, texture);
		this.cacheSizes.set(cacheId, { width, height });
		this.cacheAccessOrder.push(cacheId);

		// Check cache limit and evict if necessary AFTER adding new cache
		this.enforceMaxCacheLimit();

		this.isUsingExistingCache = false;
		return true; // Creating new cache
	}

	/**
	 * End cache group - returns cache info if available
	 */
	endCacheGroup(): { texture: WebGLTexture; width: number; height: number } | null {
		if (!this.isInCacheGroup) {
			throw new Error('No cache group to end');
		}

		const cacheId = this.currentCacheId!;
		const texture = this.cacheMap.get(cacheId);
		const size = this.cacheSizes.get(cacheId);

		// Reset state
		this.isInCacheGroup = false;
		this.currentCacheId = null;
		this.isUsingExistingCache = false;

		if (texture && size) {
			return { texture, width: size.width, height: size.height };
		}

		return null;
	}

	/**
	 * Check if we should skip drawing operations (cache exists)
	 */
	shouldSkipDrawing(): boolean {
		if (!this.isInCacheGroup) {
			return false;
		}

		// Skip drawing only if we're reusing an existing cache
		return this.isUsingExistingCache;
	}

	/**
	 * Get the framebuffer for current cache (for rendering to)
	 */
	getCurrentCacheFramebuffer(): WebGLFramebuffer | null {
		if (!this.isInCacheGroup || !this.currentCacheId) {
			return null;
		}

		return this.cacheFramebuffers.get(this.currentCacheId) || null;
	}

	/**
	 * Create WebGL framebuffer and texture for caching
	 */
	private createCacheFramebuffer(width: number, height: number): {
		framebuffer: WebGLFramebuffer;
		texture: WebGLTexture;
	} {
		const gl = this.gl;

		// Create texture
		const texture = gl.createTexture();
		if (!texture) {
			throw new Error('Failed to create cache texture');
		}

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// Create framebuffer
		const framebuffer = gl.createFramebuffer();
		if (!framebuffer) {
			throw new Error('Failed to create cache framebuffer');
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

		// Check framebuffer completeness
		const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (status !== gl.FRAMEBUFFER_COMPLETE) {
			throw new Error(`Framebuffer incomplete: ${status}`);
		}

		// Restore default framebuffer
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);

		return { framebuffer, texture };
	}

	/**
	 * Enforce cache size limit using LRU eviction
	 */
	private enforceMaxCacheLimit(): void {
		while (this.cacheMap.size > this.maxCacheItems) {
			const oldestCacheId = this.cacheAccessOrder.shift();
			if (oldestCacheId) {
				this.clearCache(oldestCacheId);
			}
		}
	}

	/**
	 * Update access order for LRU tracking
	 */
	private updateCacheAccess(cacheId: string): void {
		// Move to end of access order (most recently used)
		const index = this.cacheAccessOrder.indexOf(cacheId);
		if (index > -1) {
			this.cacheAccessOrder.splice(index, 1);
		}
		this.cacheAccessOrder.push(cacheId);
	}

	/**
	 * Clear specific cache entry
	 */
	clearCache(cacheId: string): void {
		const texture = this.cacheMap.get(cacheId);
		const framebuffer = this.cacheFramebuffers.get(cacheId);

		if (texture) {
			this.gl.deleteTexture(texture);
			this.cacheMap.delete(cacheId);
		}

		if (framebuffer) {
			this.gl.deleteFramebuffer(framebuffer);
			this.cacheFramebuffers.delete(cacheId);
		}

		this.cacheSizes.delete(cacheId);

		// Remove from access order
		const index = this.cacheAccessOrder.indexOf(cacheId);
		if (index > -1) {
			this.cacheAccessOrder.splice(index, 1);
		}
	}

	/**
	 * Clear all caches
	 */
	clearAllCaches(): void {
		for (const cacheId of Array.from(this.cacheMap.keys())) {
			this.clearCache(cacheId);
		}
	}

	/**
	 * Set maximum cache items limit
	 */
	setMaxCacheItems(limit: number): void {
		this.maxCacheItems = limit;
		this.enforceMaxCacheLimit();
	}

	/**
	 * Check if cache exists
	 */
	getCacheExists(cacheId: string): boolean {
		return this.cacheMap.has(cacheId);
	}

	/**
	 * Get cache count
	 */
	getCacheCount(): number {
		return this.cacheMap.size;
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { count: number; maxItems: number; memoryEstimate: number } {
		let memoryEstimate = 0;
		for (const { width, height } of this.cacheSizes.values()) {
			memoryEstimate += width * height * 4; // RGBA bytes
		}

		return {
			count: this.cacheMap.size,
			maxItems: this.maxCacheItems,
			memoryEstimate,
		};
	}

	/**
	 * Check if currently in a cache group
	 */
	getIsInCacheGroup(): boolean {
		return this.isInCacheGroup;
	}

	/**
	 * Get current cache ID
	 */
	getCurrentCacheId(): string | null {
		return this.currentCacheId;
	}
}