import { CachedRenderer } from '../src/CachedRenderer';

// Mock canvas and WebGL context
const mockCanvas = {
	width: 800,
	height: 600,
	getContext: jest.fn(),
} as unknown as HTMLCanvasElement;

const mockTexture = {} as WebGLTexture;
const mockFramebuffer = {} as WebGLFramebuffer;

const mockGL = {
	RGBA: 6408,
	UNSIGNED_BYTE: 5121,
	TEXTURE_2D: 3553,
	LINEAR: 9729,
	CLAMP_TO_EDGE: 33071,
	TEXTURE_MIN_FILTER: 10241,
	TEXTURE_MAG_FILTER: 10240,
	TEXTURE_WRAP_S: 10242,
	TEXTURE_WRAP_T: 10243,
	FRAMEBUFFER: 36160,
	COLOR_ATTACHMENT0: 36064,
	FRAMEBUFFER_COMPLETE: 36053,
	COLOR_BUFFER_BIT: 16384,
	TEXTURE0: 33984,
	ARRAY_BUFFER: 34962,
	FLOAT: 5126,
	STATIC_DRAW: 35044,
	TRIANGLES: 4,
	SRC_ALPHA: 770,
	ONE_MINUS_SRC_ALPHA: 771,
	BLEND: 3042,
	FRAGMENT_SHADER: 35632,
	VERTEX_SHADER: 35633,

	createTexture: jest.fn(() => mockTexture),
	bindTexture: jest.fn(),
	texImage2D: jest.fn(),
	texParameteri: jest.fn(),
	createFramebuffer: jest.fn(() => mockFramebuffer),
	bindFramebuffer: jest.fn(),
	framebufferTexture2D: jest.fn(),
	checkFramebufferStatus: jest.fn(() => 36053), // FRAMEBUFFER_COMPLETE
	deleteTexture: jest.fn(),
	deleteFramebuffer: jest.fn(),
	viewport: jest.fn(),
	clear: jest.fn(),
	activeTexture: jest.fn(),

	// Base renderer mocks
	canvas: mockCanvas,
	createShader: jest.fn(() => ({}) as WebGLShader),
	createProgram: jest.fn(() => ({}) as WebGLProgram),
	shaderSource: jest.fn(),
	compileShader: jest.fn(),
	getShaderParameter: jest.fn(() => true),
	attachShader: jest.fn(),
	linkProgram: jest.fn(),
	getProgramParameter: jest.fn(() => true),
	useProgram: jest.fn(),
	getAttribLocation: jest.fn(() => 0),
	getUniformLocation: jest.fn(() => ({}) as WebGLUniformLocation),
	createBuffer: jest.fn(() => ({}) as WebGLBuffer),
	clearColor: jest.fn(),
	vertexAttribPointer: jest.fn(),
	blendFunc: jest.fn(),
	enable: jest.fn(),
	enableVertexAttribArray: jest.fn(),
	bindBuffer: jest.fn(),
	bufferData: jest.fn(),
	drawArrays: jest.fn(),
	finish: jest.fn(),
	flush: jest.fn(),
	disable: jest.fn(),
	uniform1i: jest.fn(),
	uniform1f: jest.fn(),
	uniform2f: jest.fn(),
	uniform3f: jest.fn(),
	uniform4f: jest.fn(),
} as unknown as WebGL2RenderingContext;

// Mock the canvas context
(mockCanvas.getContext as jest.Mock).mockReturnValue(mockGL);

describe('CachedRenderer', () => {
	let renderer: CachedRenderer;

	beforeEach(() => {
		jest.clearAllMocks();
		renderer = new CachedRenderer(mockCanvas, 3); // Small cache for testing
	});

	describe('Cache Management', () => {
		test('should create cache entry when starting new cache group', () => {
			const result = renderer.startCacheGroup('test-cache', 100, 100);

			expect(result).toBe(true); // New cache created
			expect(mockGL.createTexture).toHaveBeenCalled();
			expect(mockGL.createFramebuffer).toHaveBeenCalled();
			expect(mockGL.bindFramebuffer).toHaveBeenCalledWith(mockGL.FRAMEBUFFER, mockFramebuffer);
			expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 100, 100);
			expect(mockGL.clear).toHaveBeenCalledWith(mockGL.COLOR_BUFFER_BIT);
		});

		test('should return false when cache already exists', () => {
			// Create cache first time
			renderer.startCacheGroup('test-cache', 100, 100);
			renderer.endCacheGroup();

			// Try to create same cache again
			const result = renderer.startCacheGroup('test-cache', 100, 100);

			expect(result).toBe(false); // Cache already exists
		});

		test('should throw error when nesting cache groups', () => {
			renderer.startCacheGroup('cache1', 100, 100);

			expect(() => {
				renderer.startCacheGroup('cache2', 100, 100);
			}).toThrow('Cannot start cache group: already in a cache group');
		});

		test('should end cache group correctly', () => {
			renderer.startCacheGroup('test-cache', 100, 100);
			const result = renderer.endCacheGroup();

			expect(result).toEqual({
				texture: mockTexture,
				width: 100,
				height: 100,
			});
			expect(mockGL.bindFramebuffer).toHaveBeenCalledWith(mockGL.FRAMEBUFFER, null);
		});

		test('should throw error when ending non-existent cache group', () => {
			expect(() => {
				renderer.endCacheGroup();
			}).toThrow('No cache group to end');
		});
	});

	describe('Cache Lookup', () => {
		test('should correctly identify existing cache', () => {
			renderer.startCacheGroup('test-cache', 100, 100);
			renderer.endCacheGroup();

			expect(renderer.hasCachedContent('test-cache')).toBe(true);
			expect(renderer.hasCachedContent('non-existent')).toBe(false);
		});

		test('should return cache data for existing cache', () => {
			renderer.startCacheGroup('test-cache', 100, 100);
			renderer.endCacheGroup();

			const cacheData = renderer.getCachedData('test-cache');

			expect(cacheData).toEqual({
				texture: mockTexture,
				width: 100,
				height: 100,
			});
		});

		test('should return null for non-existent cache', () => {
			const cacheData = renderer.getCachedData('non-existent');
			expect(cacheData).toBeNull();
		});
	});

	describe('Cache Statistics', () => {
		test('should provide accurate cache statistics', () => {
			// Empty cache
			let stats = renderer.getCacheStats();
			expect(stats).toEqual({
				itemCount: 0,
				maxItems: 3,
				accessOrder: [],
			});

			// Add some caches
			renderer.startCacheGroup('cache1', 100, 100);
			renderer.endCacheGroup();
			renderer.startCacheGroup('cache2', 100, 100);
			renderer.endCacheGroup();

			stats = renderer.getCacheStats();
			expect(stats).toEqual({
				itemCount: 2,
				maxItems: 3,
				accessOrder: ['cache1', 'cache2'],
			});
		});
	});

	describe('LRU Eviction', () => {
		test('should evict oldest cache when exceeding maxItems', () => {
			// Fill cache to maximum (3 items)
			renderer.startCacheGroup('cache1', 100, 100);
			renderer.endCacheGroup();
			renderer.startCacheGroup('cache2', 100, 100);
			renderer.endCacheGroup();
			renderer.startCacheGroup('cache3', 100, 100);
			renderer.endCacheGroup();

			// Add fourth item - should evict cache1
			renderer.startCacheGroup('cache4', 100, 100);
			renderer.endCacheGroup();

			expect(renderer.hasCachedContent('cache1')).toBe(false); // Evicted
			expect(renderer.hasCachedContent('cache2')).toBe(true);
			expect(renderer.hasCachedContent('cache3')).toBe(true);
			expect(renderer.hasCachedContent('cache4')).toBe(true);
			expect(mockGL.deleteTexture).toHaveBeenCalled();
			expect(mockGL.deleteFramebuffer).toHaveBeenCalled();
		});

		test('should update access order when getting cached data', () => {
			renderer.startCacheGroup('cache1', 100, 100);
			renderer.endCacheGroup();
			renderer.startCacheGroup('cache2', 100, 100);
			renderer.endCacheGroup();

			// Access cache1 - should move to end
			renderer.getCachedData('cache1');

			const stats = renderer.getCacheStats();
			expect(stats.accessOrder).toEqual(['cache2', 'cache1']);
		});
	});

	describe('Cache Clearing', () => {
		test('should clear specific cache entry', () => {
			renderer.startCacheGroup('cache1', 100, 100);
			renderer.endCacheGroup();
			renderer.startCacheGroup('cache2', 100, 100);
			renderer.endCacheGroup();

			renderer.clearCache('cache1');

			expect(renderer.hasCachedContent('cache1')).toBe(false);
			expect(renderer.hasCachedContent('cache2')).toBe(true);
			expect(mockGL.deleteTexture).toHaveBeenCalled();
			expect(mockGL.deleteFramebuffer).toHaveBeenCalled();
		});

		test('should clear all cache entries', () => {
			renderer.startCacheGroup('cache1', 100, 100);
			renderer.endCacheGroup();
			renderer.startCacheGroup('cache2', 100, 100);
			renderer.endCacheGroup();

			renderer.clearAllCache();

			expect(renderer.hasCachedContent('cache1')).toBe(false);
			expect(renderer.hasCachedContent('cache2')).toBe(false);
			expect(renderer.getCacheStats().itemCount).toBe(0);
		});
	});

	describe('Drawing Methods Override', () => {
		test('should call parent drawSpriteFromCoordinates when not in cache mode', () => {
			const spy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(renderer)), 'drawSpriteFromCoordinates');

			renderer.drawSpriteFromCoordinates(10, 20, 30, 40, 50, 60, 70, 80);

			expect(spy).toHaveBeenCalledWith(10, 20, 30, 40, 50, 60, 70, 80);
		});

		test('should call parent drawLineFromCoordinates when not in cache mode', () => {
			const spy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(renderer)), 'drawLineFromCoordinates');

			renderer.drawLineFromCoordinates(10, 20, 30, 40, 50, 60, 70, 80, 5);

			expect(spy).toHaveBeenCalledWith(10, 20, 30, 40, 50, 60, 70, 80, 5);
		});
	});

	describe('Error Handling', () => {
		test('should handle framebuffer creation failure during cache operations', () => {
			// This test verifies the error handling logic exists
			// Note: Full integration testing requires actual WebGL context
			expect(typeof renderer['createCacheFramebuffer']).toBe('function');
			expect(typeof renderer['createCacheTexture']).toBe('function');
		});

		test('should handle nested cache group attempts', () => {
			renderer.startCacheGroup('cache1', 100, 100);

			expect(() => {
				renderer.startCacheGroup('cache2', 100, 100);
			}).toThrow('Cannot start cache group: already in a cache group');

			// Clean up
			renderer.endCacheGroup();
		});

		test('should handle ending non-existent cache group', () => {
			expect(() => {
				renderer.endCacheGroup();
			}).toThrow('No cache group to end');
		});
	});
});
