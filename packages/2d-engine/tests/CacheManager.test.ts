import { CacheManager } from '../src/CacheManager';

// Mock WebGL context for testing
const createMockGL = (): Partial<WebGL2RenderingContext> => {
	const mockTexture = {} as WebGLTexture;
	const mockFramebuffer = {} as WebGLFramebuffer;

	return {
		createTexture: jest.fn(() => mockTexture),
		createFramebuffer: jest.fn(() => mockFramebuffer),
		bindTexture: jest.fn(),
		bindFramebuffer: jest.fn(),
		texImage2D: jest.fn(),
		texParameteri: jest.fn(),
		framebufferTexture2D: jest.fn(),
		checkFramebufferStatus: jest.fn(() => 36053), // FRAMEBUFFER_COMPLETE
		deleteTexture: jest.fn(),
		deleteFramebuffer: jest.fn(),
		TEXTURE_2D: 3553,
		RGBA: 6408,
		UNSIGNED_BYTE: 5121,
		TEXTURE_MIN_FILTER: 10241,
		TEXTURE_MAG_FILTER: 10240,
		LINEAR: 9729,
		TEXTURE_WRAP_S: 10242,
		TEXTURE_WRAP_T: 10243,
		CLAMP_TO_EDGE: 33071,
		FRAMEBUFFER: 36160,
		COLOR_ATTACHMENT0: 36064,
		FRAMEBUFFER_COMPLETE: 36053,
	};
};

describe('CacheManager', () => {
	let cacheManager: CacheManager;
	let mockGL: Partial<WebGL2RenderingContext>;

	beforeEach(() => {
		mockGL = createMockGL();
		cacheManager = new CacheManager(mockGL as WebGL2RenderingContext, 3); // Small limit for testing
	});

	describe('Basic Cache Operations', () => {
		test('should start and end cache group successfully', () => {
			const isCreatingNew = cacheManager.startCacheGroup('test-cache', 100, 100);
			
			expect(isCreatingNew).toBe(true);
			expect(cacheManager.getIsInCacheGroup()).toBe(true);
			expect(cacheManager.getCurrentCacheId()).toBe('test-cache');
			expect(cacheManager.shouldSkipDrawing()).toBe(false);

			const cacheInfo = cacheManager.endCacheGroup();
			
			expect(cacheInfo).toBeTruthy();
			expect(cacheInfo?.width).toBe(100);
			expect(cacheInfo?.height).toBe(100);
			expect(cacheManager.getIsInCacheGroup()).toBe(false);
			expect(cacheManager.getCurrentCacheId()).toBe(null);
		});

		test('should reuse existing cache', () => {
			// Create cache first time
			cacheManager.startCacheGroup('test-cache', 100, 100);
			cacheManager.endCacheGroup();

			// Use cache second time
			const isCreatingNew = cacheManager.startCacheGroup('test-cache', 100, 100);
			
			expect(isCreatingNew).toBe(false);
			expect(cacheManager.shouldSkipDrawing()).toBe(true);
			
			cacheManager.endCacheGroup();
		});

		test('should prevent nesting cache groups', () => {
			cacheManager.startCacheGroup('cache1', 100, 100);
			
			expect(() => {
				cacheManager.startCacheGroup('cache2', 100, 100);
			}).toThrow('Cannot nest cache groups');
		});

		test('should handle end cache group without start', () => {
			expect(() => {
				cacheManager.endCacheGroup();
			}).toThrow('No cache group to end');
		});
	});

	describe('LRU Eviction', () => {
		test('should evict oldest cache when limit exceeded', () => {
			// Fill cache to limit (3 items)
			cacheManager.startCacheGroup('cache1', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache2', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache3', 100, 100);
			cacheManager.endCacheGroup();

			expect(cacheManager.getCacheCount()).toBe(3);

			// Add fourth cache (should evict cache1)
			cacheManager.startCacheGroup('cache4', 100, 100);
			cacheManager.endCacheGroup();

			expect(cacheManager.getCacheCount()).toBe(3); // Still at limit
			expect(cacheManager.getCacheExists('cache1')).toBe(false); // Oldest evicted
			expect(cacheManager.getCacheExists('cache2')).toBe(true);
			expect(cacheManager.getCacheExists('cache3')).toBe(true);
			expect(cacheManager.getCacheExists('cache4')).toBe(true); // New one added
		});

		test('should update access order when reusing cache', () => {
			// Create three caches
			cacheManager.startCacheGroup('cache1', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache2', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache3', 100, 100);
			cacheManager.endCacheGroup();

			// Access cache1 (moves it to end of LRU)
			cacheManager.startCacheGroup('cache1', 100, 100);
			cacheManager.endCacheGroup();

			// Add fourth cache (should evict cache2, not cache1)
			cacheManager.startCacheGroup('cache4', 100, 100);
			cacheManager.endCacheGroup();

			expect(cacheManager.getCacheCount()).toBe(3); // At limit
			expect(cacheManager.getCacheExists('cache1')).toBe(true); // Recently accessed, kept
			expect(cacheManager.getCacheExists('cache2')).toBe(false); // Oldest after cache1 access, evicted
			expect(cacheManager.getCacheExists('cache3')).toBe(true);
			expect(cacheManager.getCacheExists('cache4')).toBe(true); // New one added
		});
	});

	describe('Cache Management', () => {
		test('should clear specific cache', () => {
			cacheManager.startCacheGroup('cache1', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache2', 100, 100);
			cacheManager.endCacheGroup();

			expect(cacheManager.getCacheCount()).toBe(2);

			cacheManager.clearCache('cache1');

			expect(cacheManager.getCacheCount()).toBe(1);
			expect(cacheManager.getCacheExists('cache1')).toBe(false);
			expect(cacheManager.getCacheExists('cache2')).toBe(true);
		});

		test('should clear all caches', () => {
			cacheManager.startCacheGroup('cache1', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache2', 100, 100);
			cacheManager.endCacheGroup();

			expect(cacheManager.getCacheCount()).toBe(2);

			cacheManager.clearAllCaches();

			expect(cacheManager.getCacheCount()).toBe(0);
			expect(cacheManager.getCacheExists('cache1')).toBe(false);
			expect(cacheManager.getCacheExists('cache2')).toBe(false);
		});

		test('should set max cache items', () => {
			// Fill original limit (3)
			cacheManager.startCacheGroup('cache1', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache2', 100, 100);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache3', 100, 100);
			cacheManager.endCacheGroup();

			expect(cacheManager.getCacheCount()).toBe(3);

			// Reduce limit to 1 (should evict two oldest)
			cacheManager.setMaxCacheItems(1);

			expect(cacheManager.getCacheCount()).toBe(1);
			expect(cacheManager.getCacheExists('cache3')).toBe(true); // Most recent kept
		});
	});

	describe('Cache Statistics', () => {
		test('should return correct cache stats', () => {
			cacheManager.startCacheGroup('cache1', 100, 50);
			cacheManager.endCacheGroup();
			
			cacheManager.startCacheGroup('cache2', 200, 100);
			cacheManager.endCacheGroup();

			const stats = cacheManager.getCacheStats();

			expect(stats.count).toBe(2);
			expect(stats.maxItems).toBe(3);
			expect(stats.memoryEstimate).toBe(
				(100 * 50 * 4) + (200 * 100 * 4) // RGBA bytes
			);
		});
	});

	describe('Error Handling', () => {
		test('should handle WebGL texture creation failure', () => {
			mockGL.createTexture.mockReturnValue(null);

			expect(() => {
				cacheManager.startCacheGroup('test-cache', 100, 100);
			}).toThrow('Failed to create cache texture');
		});

		test('should handle WebGL framebuffer creation failure', () => {
			mockGL.createFramebuffer.mockReturnValue(null);

			expect(() => {
				cacheManager.startCacheGroup('test-cache', 100, 100);
			}).toThrow('Failed to create cache framebuffer');
		});

		test('should handle incomplete framebuffer', () => {
			mockGL.checkFramebufferStatus.mockReturnValue(36054); // Not FRAMEBUFFER_COMPLETE

			expect(() => {
				cacheManager.startCacheGroup('test-cache', 100, 100);
			}).toThrow('Framebuffer incomplete');
		});
	});
});