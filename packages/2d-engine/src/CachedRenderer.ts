import { Renderer } from './renderer';

/**
 * CachedRenderer extends the base Renderer with integrated cache management
 * for improved performance when drawing complex or frequently-used content.
 */
export class CachedRenderer extends Renderer {
	// Cache state integrated directly (no separate CacheManager)
	private cacheMap: Map<string, WebGLTexture>;
	private cacheFramebuffers: Map<string, WebGLFramebuffer>;
	private cacheSizes: Map<string, { width: number; height: number }>;
	private cacheAccessOrder: string[]; // For LRU tracking
	private maxCacheItems: number;
	private currentCacheId: string | null = null;
	private currentCacheFramebuffer: WebGLFramebuffer | null = null;
	private currentCacheSize: { width: number; height: number } | null = null;

	constructor(canvas: HTMLCanvasElement, maxCacheItems: number = 50) {
		super(canvas);
		this.maxCacheItems = maxCacheItems;
		this.cacheMap = new Map();
		this.cacheFramebuffers = new Map();
		this.cacheSizes = new Map();
		this.cacheAccessOrder = [];
	}

	/**
	 * Override drawing methods to respect cache state
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
		if (this.shouldSkipDrawing()) return;
		super.drawSpriteFromCoordinates(x, y, width, height, spriteX, spriteY, spriteWidth, spriteHeight);
	}

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
		if (this.shouldSkipDrawing()) return;
		super.drawLineFromCoordinates(x1, y1, x2, y2, spriteX, spriteY, spriteWidth, spriteHeight, thickness);
	}

	/**
	 * Start a cache group - subsequent drawing operations will be cached
	 * @param cacheId - Unique identifier for this cache group
	 * @param width - Width of the cache texture
	 * @param height - Height of the cache texture
	 * @returns true if cache was created/started, false if cache already exists
	 */
	startCacheGroup(cacheId: string, width: number, height: number): boolean {
		// Prevent nesting cache groups
		if (this.currentCacheId !== null) {
			throw new Error('Cannot start cache group: already in a cache group');
		}

		// Check if cache already exists
		if (this.cacheMap.has(cacheId)) {
			// Update access order for LRU
			this.updateAccessOrder(cacheId);
			return false; // Cache already exists
		}

		// Flush any pending vertex data to the main framebuffer first
		if (this.bufferCounter > 0) {
			super.renderVertexBuffer();
			super.resetBuffers();
		}

		// Create new cache entry
		const cacheTexture = this.createCacheTexture(width, height);
		const cacheFramebuffer = this.createCacheFramebuffer(cacheTexture);

		// Store cache data
		this.cacheMap.set(cacheId, cacheTexture);
		this.cacheFramebuffers.set(cacheId, cacheFramebuffer);
		this.cacheSizes.set(cacheId, { width, height });
		this.cacheAccessOrder.push(cacheId);

		// Set current cache state
		this.currentCacheId = cacheId;
		this.currentCacheFramebuffer = cacheFramebuffer;
		this.currentCacheSize = { width, height };

		// Switch to rendering to cache framebuffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, cacheFramebuffer);
		this.gl.viewport(0, 0, width, height);

		// Make sure sprite sheet is bound for rendering to cache
		if (this.spriteSheet) {
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteSheet);
		}

		// Clear to the same background color as the main canvas
		this.gl.clearColor(0, 0, 0, 1); // opaque black background like main canvas
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);

		// Evict old cache entries if necessary
		this.evictOldCacheEntries();

		console.log(`[Cache] Started cache group ${cacheId} (${width}x${height})`);
		return true; // New cache created
	}

	/**
	 * End the current cache group
	 * @returns Cache data if successful, null if no cache group was active
	 */
	endCacheGroup(): { texture: WebGLTexture; width: number; height: number } | null {
		if (this.currentCacheId === null || this.currentCacheFramebuffer === null || this.currentCacheSize === null) {
			throw new Error('No cache group to end');
		}

		// Render any buffered content to the cache
		if (this.bufferCounter > 0) {
			console.log(`[Cache] Rendering ${this.bufferCounter / 2} triangles to cache framebuffer`);
			super.renderVertexBuffer();
			super.resetBuffers();
		}

		// Debug: Try to read back pixels from the framebuffer to verify content was rendered
		const pixelData = new Uint8Array(4 * 4); // Sample 2x2 pixels
		this.gl.readPixels(0, 0, 2, 2, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixelData);

		let hasNonBlackPixels = false;
		for (let i = 0; i < pixelData.length; i += 4) {
			const r = pixelData[i],
				g = pixelData[i + 1],
				b = pixelData[i + 2],
				a = pixelData[i + 3];
			if (r > 0 || g > 0 || b > 0 || a !== 255) {
				hasNonBlackPixels = true;
				break;
			}
		}

		console.log(`[Cache] Framebuffer content check - has non-black pixels: ${hasNonBlackPixels}`);
		console.log(`[Cache] Sample pixels:`, Array.from(pixelData.slice(0, 8)));

		// Get cache data
		const cacheTexture = this.cacheMap.get(this.currentCacheId)!;
		const result = {
			texture: cacheTexture,
			width: this.currentCacheSize.width,
			height: this.currentCacheSize.height,
		};

		console.log(
			`[Cache] Ended cache group ${this.currentCacheId} (${this.currentCacheSize.width}x${this.currentCacheSize.height})`
		);

		// Switch back to default framebuffer (canvas)
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

		// Restore original clear color
		this.gl.clearColor(0, 0, 0, 1.0);

		// Rebind sprite sheet for main rendering
		if (this.spriteSheet) {
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteSheet);
		}

		// Clear current cache state
		this.currentCacheId = null;
		this.currentCacheFramebuffer = null;
		this.currentCacheSize = null;

		return result;
	}

	/**
	 * Check if we should skip drawing (when creating cache)
	 */
	private shouldSkipDrawing(): boolean {
		// Only skip if we're using a cached texture (not creating one)
		return false; // For now, we always draw - cache usage is handled by drawCachedTexture
	}

	/**
	 * Clear a specific cache entry
	 * @param cacheId - ID of the cache to clear
	 */
	clearCache(cacheId: string): void {
		// Clean up WebGL resources
		const texture = this.cacheMap.get(cacheId);
		const framebuffer = this.cacheFramebuffers.get(cacheId);

		if (texture) {
			this.gl.deleteTexture(texture);
		}
		if (framebuffer) {
			this.gl.deleteFramebuffer(framebuffer);
		}

		// Remove from all tracking structures
		this.cacheMap.delete(cacheId);
		this.cacheFramebuffers.delete(cacheId);
		this.cacheSizes.delete(cacheId);

		const index = this.cacheAccessOrder.indexOf(cacheId);
		if (index > -1) {
			this.cacheAccessOrder.splice(index, 1);
		}
	}

	/**
	 * Draw a cached texture to the screen
	 * @param texture - WebGL texture to draw
	 * @param width - Width to draw the texture
	 * @param height - Height to draw the texture
	 * @param x - X position to draw at (default 0)
	 * @param y - Y position to draw at (default 0)
	 */
	drawCachedTexture(texture: WebGLTexture, width: number, height: number, x: number = 0, y: number = 0): void {
		// Flush any pending sprites with the current sprite sheet
		if (this.bufferCounter > 0) {
			super.renderVertexBuffer();
			this.resetBuffers();
		}

		console.log(`[Cache] Drawing cached texture at (${x}, ${y}) size ${width}x${height}`);

		// Debug: Check what texture is currently bound
		const currentTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
		console.log(`[Cache] Current bound texture before:`, currentTexture);
		console.log(`[Cache] Target cached texture:`, texture);

		// Auto-flush buffer if full (prevents overflow)
		if (this.bufferCounter + 12 > this.bufferSize) {
			super.renderVertexBuffer();
			this.resetBuffers();
		}

		// Fill vertex buffer with rectangle vertices
		const bufferOffset = this.bufferPointer;

		// Position vertices (same as regular sprite)
		const x1 = x;
		const x2 = x + width;
		const y1 = y;
		const y2 = y + height;

		// Triangle 1
		this.vertexBuffer[bufferOffset] = x1;
		this.vertexBuffer[bufferOffset + 1] = y1;
		this.vertexBuffer[bufferOffset + 2] = x2;
		this.vertexBuffer[bufferOffset + 3] = y1;
		this.vertexBuffer[bufferOffset + 4] = x1;
		this.vertexBuffer[bufferOffset + 5] = y2;

		// Triangle 2
		this.vertexBuffer[bufferOffset + 6] = x1;
		this.vertexBuffer[bufferOffset + 7] = y2;
		this.vertexBuffer[bufferOffset + 8] = x2;
		this.vertexBuffer[bufferOffset + 9] = y1;
		this.vertexBuffer[bufferOffset + 10] = x2;
		this.vertexBuffer[bufferOffset + 11] = y2;

		// Texture coordinates - use full texture (0,0 to 1,1)
		// Note: WebGL framebuffers have flipped Y coordinates compared to regular textures
		// Triangle 1
		this.textureCoordinateBuffer[bufferOffset] = 0; // u1
		this.textureCoordinateBuffer[bufferOffset + 1] = 1; // v1 (flipped)
		this.textureCoordinateBuffer[bufferOffset + 2] = 1; // u2
		this.textureCoordinateBuffer[bufferOffset + 3] = 1; // v1 (flipped)
		this.textureCoordinateBuffer[bufferOffset + 4] = 0; // u1
		this.textureCoordinateBuffer[bufferOffset + 5] = 0; // v2 (flipped)

		// Triangle 2
		this.textureCoordinateBuffer[bufferOffset + 6] = 0; // u1
		this.textureCoordinateBuffer[bufferOffset + 7] = 0; // v2 (flipped)
		this.textureCoordinateBuffer[bufferOffset + 8] = 1; // u2
		this.textureCoordinateBuffer[bufferOffset + 9] = 1; // v1 (flipped)
		this.textureCoordinateBuffer[bufferOffset + 10] = 1; // u2
		this.textureCoordinateBuffer[bufferOffset + 11] = 0; // v2 (flipped)

		// Advance buffer counters
		this.bufferCounter += 12;
		this.bufferPointer = this.bufferCounter;

		// Bind the cached texture
		this.gl.activeTexture(this.gl.TEXTURE0);
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

		// Debug: Verify texture is bound correctly
		const boundTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
		console.log(`[Cache] Bound texture after binding:`, boundTexture);
		console.log(`[Cache] Texture binding successful:`, boundTexture === texture);

		// Debug: Try to read back a single pixel from the texture to verify it has content
		const framebuffer = this.gl.createFramebuffer();
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

		if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) === this.gl.FRAMEBUFFER_COMPLETE) {
			const pixel = new Uint8Array(4);
			this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
			console.log(`[Cache] Sample pixel from cached texture: [${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]}]`);
		} else {
			console.log(`[Cache] Warning: Cached texture framebuffer not complete for pixel reading`);
		}

		// Restore main framebuffer
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.deleteFramebuffer(framebuffer);

		// Immediately render this cached texture
		super.renderVertexBuffer();
		this.resetBuffers();

		// Debug: Check what texture is bound after rendering
		const afterTexture = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
		console.log(`[Cache] Bound texture after rendering:`, afterTexture);

		// Restore sprite sheet texture for subsequent normal rendering
		if (this.spriteSheet) {
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteSheet);
			console.log(`[Cache] Restored sprite sheet texture:`, this.spriteSheet);
		}
	}

	/**
	 * Check if a cache entry exists
	 * @param cacheId - ID to check
	 */
	hasCachedContent(cacheId: string): boolean {
		return this.cacheMap.has(cacheId);
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): { itemCount: number; maxItems: number; accessOrder: string[] } {
		return {
			itemCount: this.cacheMap.size,
			maxItems: this.maxCacheItems,
			accessOrder: [...this.cacheAccessOrder], // Return copy
		};
	}

	/**
	 * Get cached texture and size data for a specific cache ID
	 * @param cacheId - ID of the cache to get
	 * @returns Cache data or null if not found
	 */
	getCachedData(cacheId: string): { texture: WebGLTexture; width: number; height: number } | null {
		const texture = this.cacheMap.get(cacheId);
		const size = this.cacheSizes.get(cacheId);

		if (texture && size) {
			// Update access order for LRU
			this.updateAccessOrder(cacheId);
			return {
				texture,
				width: size.width,
				height: size.height,
			};
		}

		return null;
	}

	/**
	 * Clear all cache entries
	 */
	clearAllCache(): void {
		// Clean up all WebGL resources
		for (const texture of this.cacheMap.values()) {
			this.gl.deleteTexture(texture);
		}
		for (const framebuffer of this.cacheFramebuffers.values()) {
			this.gl.deleteFramebuffer(framebuffer);
		}

		// Clear all tracking structures
		this.cacheMap.clear();
		this.cacheFramebuffers.clear();
		this.cacheSizes.clear();
		this.cacheAccessOrder.length = 0;
	}

	/**
	 * Create a texture for caching
	 */
	private createCacheTexture(width: number, height: number): WebGLTexture {
		const texture = this.gl.createTexture();
		if (!texture) {
			throw new Error('Failed to create cache texture');
		}

		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
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
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

		return texture;
	}

	/**
	 * Create a framebuffer for caching
	 */
	private createCacheFramebuffer(texture: WebGLTexture): WebGLFramebuffer {
		const framebuffer = this.gl.createFramebuffer();
		if (!framebuffer) {
			throw new Error('Failed to create cache framebuffer');
		}

		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
		this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

		// Check framebuffer completeness
		if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
			this.gl.deleteFramebuffer(framebuffer);
			throw new Error('Cache framebuffer not complete');
		}

		return framebuffer;
	}

	/**
	 * Update access order for LRU tracking
	 */
	private updateAccessOrder(cacheId: string): void {
		const index = this.cacheAccessOrder.indexOf(cacheId);
		if (index > -1) {
			// Move to end (most recently used)
			this.cacheAccessOrder.splice(index, 1);
			this.cacheAccessOrder.push(cacheId);
		}
	}

	/**
	 * Evict old cache entries using LRU strategy
	 */
	private evictOldCacheEntries(): void {
		while (this.cacheMap.size > this.maxCacheItems) {
			const oldestCacheId = this.cacheAccessOrder.shift();
			if (oldestCacheId) {
				this.clearCache(oldestCacheId);
			}
		}
	}
}
