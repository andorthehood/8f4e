import { Renderer } from './renderer';

/**
 * CachedRenderer extends the base Renderer with integrated cache management
 * for improved performance when drawing complex or frequently-used content.
 */
export class CachedRenderer extends Renderer {
	private cacheMap: Map<string, WebGLTexture>;
	private cacheFramebuffers: Map<string, WebGLFramebuffer>;
	private cacheSizes: Map<string, { width: number; height: number }>;
	private cacheAccessOrder: string[]; // For LRU tracking
	private maxCacheItems: number;
	private currentCacheId: string | null = null;
	private currentCacheFramebuffer: WebGLFramebuffer | null = null;
	private currentCacheSize: { width: number; height: number } | null = null;
	private isSkippingDraws: boolean = false;
	// Draw order segmentation: preserves relative order between sprite-sheet draws and cached quads
	private segments: Array<{ texture: WebGLTexture | 'SPRITESHEET'; start: number; end?: number }> = [];
	private currentSegmentTexture: WebGLTexture | 'SPRITESHEET' = 'SPRITESHEET';

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
		// Record that subsequent vertices belong to the sprite sheet segment (only during playback)
		if (this.currentCacheId === null) {
			this.ensureSegment('SPRITESHEET');
		}
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
		if (this.currentCacheId === null) {
			this.ensureSegment('SPRITESHEET');
		}
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

		// Update resolution uniform to match cache target
		this.setUniform('u_resolution', width, height);

		// Make sure sprite sheet is bound for rendering to cache
		if (this.spriteSheet) {
			this.gl.activeTexture(this.gl.TEXTURE0);
			this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteSheet);
		}

		// Clear to transparent so cached areas don't draw opaque rects
		this.gl.clearColor(0, 0, 0, 0);
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

		// Restore resolution uniform for canvas rendering
		this.setUniform('u_resolution', this.gl.canvas.width, this.gl.canvas.height);

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
		return this.isSkippingDraws;
	}

	/** Control skipping of normal draw calls during cache playback */
	beginSkipNormalDraws(): void {
		this.isSkippingDraws = true;
	}

	endSkipNormalDraws(): void {
		this.isSkippingDraws = false;
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
		// Never draw cached content while capturing a cache
		if (this.currentCacheId !== null) return;

		// Ensure a segment for this cached texture
		this.ensureSegment(texture);

		// Auto-flush buffer if full (unlikely here, but safe)
		if (this.bufferCounter + 12 > this.bufferSize) {
			super.renderVertexBuffer();
			this.resetBuffers();
			this.ensureSegment(texture);
		}

		// Append one textured quad
		const off = this.bufferPointer;
		const x1 = x,
			x2 = x + width,
			y1 = y,
			y2 = y + height;
		// positions
		this.vertexBuffer[off] = x1;
		this.vertexBuffer[off + 1] = y1;
		this.vertexBuffer[off + 2] = x2;
		this.vertexBuffer[off + 3] = y1;
		this.vertexBuffer[off + 4] = x1;
		this.vertexBuffer[off + 5] = y2;
		this.vertexBuffer[off + 6] = x1;
		this.vertexBuffer[off + 7] = y2;
		this.vertexBuffer[off + 8] = x2;
		this.vertexBuffer[off + 9] = y1;
		this.vertexBuffer[off + 10] = x2;
		this.vertexBuffer[off + 11] = y2;
		// UVs: flip V only to compensate FBO orientation
		this.textureCoordinateBuffer[off] = 0;
		this.textureCoordinateBuffer[off + 1] = 1;
		this.textureCoordinateBuffer[off + 2] = 1;
		this.textureCoordinateBuffer[off + 3] = 1;
		this.textureCoordinateBuffer[off + 4] = 0;
		this.textureCoordinateBuffer[off + 5] = 0;
		this.textureCoordinateBuffer[off + 6] = 0;
		this.textureCoordinateBuffer[off + 7] = 0;
		this.textureCoordinateBuffer[off + 8] = 1;
		this.textureCoordinateBuffer[off + 9] = 1;
		this.textureCoordinateBuffer[off + 10] = 1;
		this.textureCoordinateBuffer[off + 11] = 0;

		this.bufferCounter += 12;
		this.bufferPointer = this.bufferCounter;
	}

	/**
	 * Render buffer content using whatever texture is currently bound to TEXTURE0.
	 * This avoids the base class behavior of rebinding the sprite sheet.
	 */
	private renderVertexBufferWithCurrentTexture(): void {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureCoordinateBuffer, this.gl.STATIC_DRAW);

		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexBuffer, this.gl.STATIC_DRAW);

		this.gl.drawArrays(this.gl.TRIANGLES, 0, Math.min(this.bufferCounter / 2, this.bufferSize / 2));

		if (this.isPerformanceMeasurementMode) {
			this.gl.finish();
		}
	}

	/** Render the frame to the off-screen texture, honoring draw order via segments */
	renderWithPostProcessing(elapsedTime: number): void {
		// Close the current segment if needed
		if (
			this.currentCacheId === null &&
			this.segments.length > 0 &&
			this.segments[this.segments.length - 1].end === undefined
		) {
			this.segments[this.segments.length - 1].end = this.bufferCounter / 2;
		}

		this.startRenderToTexture();

		// Upload buffers once
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glTextureCoordinateBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.textureCoordinateBuffer, this.gl.STATIC_DRAW);
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glPositionBuffer);
		this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexBuffer, this.gl.STATIC_DRAW);

		const textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
		if (textureLocation) {
			// @ts-ignore
			this.gl.uniform1i(textureLocation, 0);
		}

		if (this.currentCacheId === null && this.segments.length > 0) {
			for (const seg of this.segments) {
				const start = seg.start;
				const end = seg.end ?? this.bufferCounter / 2;
				const count = end - start;
				if (count <= 0) continue;
				this.gl.activeTexture(this.gl.TEXTURE0);
				if (seg.texture === 'SPRITESHEET') {
					if (this.spriteSheet) this.gl.bindTexture(this.gl.TEXTURE_2D, this.spriteSheet);
				} else {
					this.gl.bindTexture(this.gl.TEXTURE_2D, seg.texture);
				}
				this.gl.drawArrays(this.gl.TRIANGLES, start, count);
			}
		} else {
			// Fallback for capture mode
			super.renderVertexBuffer();
		}

		this.endRenderToTexture();
		this.gl.flush();
		this.gl.bindTexture(this.gl.TEXTURE_2D, null);
		this.renderPostProcess(elapsedTime);

		// Reset segments for next frame, keep counters for stats
		this.segments.length = 0;
		this.currentSegmentTexture = 'SPRITESHEET';
	}

	private ensureSegment(texture: WebGLTexture | 'SPRITESHEET'): void {
		if (this.currentCacheId !== null) return; // don't record during capture
		const currentVertexIndex = this.bufferCounter / 2;
		if (this.segments.length === 0) {
			// First segment of the frame
			this.segments.push({ texture, start: currentVertexIndex });
			this.currentSegmentTexture = texture;
			return;
		}
		if (this.currentSegmentTexture !== texture) {
			// Close previous segment, if open
			if (this.segments[this.segments.length - 1].end === undefined) {
				this.segments[this.segments.length - 1].end = currentVertexIndex;
			}
			// Start new segment at current vertex index
			this.segments.push({ texture, start: currentVertexIndex });
			this.currentSegmentTexture = texture;
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
