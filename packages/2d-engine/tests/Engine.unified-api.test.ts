import { Engine } from '../src/engine';

// Mock canvas and WebGL context
const mockCanvas = {
	width: 800,
	height: 600,
	getContext: jest.fn(),
} as unknown as HTMLCanvasElement;

const mockTexture = {} as WebGLTexture;
const mockFramebuffer = {} as WebGLFramebuffer;

const mockGL = {
	// Constants
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

	// Methods
	createTexture: jest.fn(() => mockTexture),
	bindTexture: jest.fn(),
	texImage2D: jest.fn(),
	texParameteri: jest.fn(),
	createFramebuffer: jest.fn(() => mockFramebuffer),
	bindFramebuffer: jest.fn(),
	framebufferTexture2D: jest.fn(),
	checkFramebufferStatus: jest.fn(() => 36053),
	deleteTexture: jest.fn(),
	deleteFramebuffer: jest.fn(),
	viewport: jest.fn(),
	clear: jest.fn(),
	activeTexture: jest.fn(),

	// Base engine/renderer mocks
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

describe('Engine - Unified API', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Constructor Options', () => {
		test('should create engine without caching by default', () => {
			const engine = new Engine(mockCanvas);
			expect(engine.isCachingEnabled).toBe(false);
		});

		test('should create engine without caching when caching: false', () => {
			const engine = new Engine(mockCanvas, { caching: false });
			expect(engine.isCachingEnabled).toBe(false);
		});

		test('should create engine with caching when caching: true', () => {
			const engine = new Engine(mockCanvas, { caching: true });
			expect(engine.isCachingEnabled).toBe(true);
		});

		test('should create engine with custom maxCacheItems', () => {
			const engine = new Engine(mockCanvas, { caching: true, maxCacheItems: 100 });
			expect(engine.isCachingEnabled).toBe(true);
			expect(engine.getCacheStats().maxItems).toBe(100);
		});

		test('should default to 50 maxCacheItems when caching enabled', () => {
			const engine = new Engine(mockCanvas, { caching: true });
			expect(engine.getCacheStats().maxItems).toBe(50);
		});
	});

	describe('Backward Compatibility', () => {
		test('should maintain all base engine functionality without options', () => {
			const engine = new Engine(mockCanvas);

			// Test that base engine methods are available
			expect(typeof engine.drawSprite).toBe('function');
			expect(typeof engine.drawLine).toBe('function');
			expect(typeof engine.startGroup).toBe('function');
			expect(typeof engine.endGroup).toBe('function');
			expect(typeof engine.loadSpriteSheet).toBe('function');
			expect(typeof engine.setSpriteLookup).toBe('function');
		});

		test('should maintain all base engine functionality with caching disabled', () => {
			const engine = new Engine(mockCanvas, { caching: false });

			// Test that base engine methods are available
			expect(typeof engine.drawSprite).toBe('function');
			expect(typeof engine.drawLine).toBe('function');
			expect(typeof engine.startGroup).toBe('function');
			expect(typeof engine.endGroup).toBe('function');
		});
	});

	describe('Caching Methods - Disabled', () => {
		let engine: Engine;

		beforeEach(() => {
			engine = new Engine(mockCanvas); // No caching
		});

		test('should handle cacheGroup gracefully without caching enabled', () => {
			let callbackExecuted = false;
			const result = engine.cacheGroup('test', 100, 100, () => {
				callbackExecuted = true;
			});
			expect(callbackExecuted).toBe(true); // Draw callback should be executed
			expect(result).toBe(false); // Should return false indicating no cache was created
		});

		test('should handle drawCachedContent gracefully without caching enabled', () => {
			expect(() => {
				engine.drawCachedContent('test', 0, 0);
			}).not.toThrow(); // Should not throw an error
		});

		test('should return false when calling hasCachedContent without caching enabled', () => {
			const result = engine.hasCachedContent('test');
			expect(result).toBe(false);
		});

		test('should handle clearCache gracefully without caching enabled', () => {
			expect(() => {
				engine.clearCache('test');
			}).not.toThrow(); // Should not throw an error
		});

		test('should handle clearAllCache gracefully without caching enabled', () => {
			expect(() => {
				engine.clearAllCache();
			}).not.toThrow(); // Should not throw an error
		});

		test('should return empty stats when calling getCacheStats without caching enabled', () => {
			const stats = engine.getCacheStats();
			expect(stats).toEqual({ itemCount: 0, maxItems: 0, accessOrder: [] });
		});
	});

	describe('Caching Methods - Enabled', () => {
		let engine: Engine;

		beforeEach(() => {
			engine = new Engine(mockCanvas, { caching: true, maxCacheItems: 5 });
		});

		test('should provide caching functionality when enabled', () => {
			expect(engine.isCachingEnabled).toBe(true);
			expect(typeof engine.cacheGroup).toBe('function');
			expect(typeof engine.drawCachedContent).toBe('function');
			expect(typeof engine.hasCachedContent).toBe('function');
			expect(typeof engine.clearCache).toBe('function');
			expect(typeof engine.clearAllCache).toBe('function');
			expect(typeof engine.getCacheStats).toBe('function');
		});

		test('should manage cache group operations with offset handling', () => {
			// Set some initial offsets
			engine.startGroup(10, 20);
			expect(engine.offsetX).toBe(10);
			expect(engine.offsetY).toBe(20);

			let insideOffset: { x: number; y: number } | null = null;
			const created = engine.cacheGroup('test-cache', 100, 100, () => {
				insideOffset = { x: engine.offsetX, y: engine.offsetY };
			});

			expect(created).toBe(true);
			expect(insideOffset).toEqual({ x: 0, y: 0 });
			expect(engine.offsetX).toBe(10);
			expect(engine.offsetY).toBe(20);

			// Clean up
			engine.endGroup();
		});

		test('should not run draw callback when cache exists', () => {
			let ran = false;

			// First call creates cache and runs draw
			const first = engine.cacheGroup('existing-cache', 200, 150, () => {
				ran = true;
			});
			expect(first).toBe(true);
			expect(ran).toBe(true);

			ran = false;

			// Second call uses cache and skips draw
			const second = engine.cacheGroup('existing-cache', 200, 150, () => {
				ran = true;
			});
			expect(second).toBe(false);
			expect(ran).toBe(false);
		});

		test('should handle enabled parameter in cacheGroup', () => {
			let ran = false;

			// With enabled: false, should always draw without caching
			const result = engine.cacheGroup(
				'disabled-cache',
				100,
				100,
				() => {
					ran = true;
				},
				false
			);

			expect(result).toBe(false);
			expect(ran).toBe(true);
			expect(engine.hasCachedContent('disabled-cache')).toBe(false);
		});

		test('should correctly identify cached content', () => {
			expect(engine.hasCachedContent('test-cache')).toBe(false);

			engine.cacheGroup('test-cache', 100, 100, () => {});

			expect(engine.hasCachedContent('test-cache')).toBe(true);
		});

		test('should clear specific cache entries', () => {
			engine.cacheGroup('cache1', 100, 100, () => {});
			engine.cacheGroup('cache2', 100, 100, () => {});

			expect(engine.hasCachedContent('cache1')).toBe(true);
			expect(engine.hasCachedContent('cache2')).toBe(true);

			engine.clearCache('cache1');

			expect(engine.hasCachedContent('cache1')).toBe(false);
			expect(engine.hasCachedContent('cache2')).toBe(true);
		});

		test('should clear all cache entries', () => {
			engine.cacheGroup('cache1', 100, 100, () => {});
			engine.cacheGroup('cache2', 100, 100, () => {});

			expect(engine.getCacheStats().itemCount).toBe(2);

			engine.clearAllCache();

			expect(engine.getCacheStats().itemCount).toBe(0);
			expect(engine.hasCachedContent('cache1')).toBe(false);
			expect(engine.hasCachedContent('cache2')).toBe(false);
		});

		test('should provide accurate cache statistics', () => {
			let stats = engine.getCacheStats();
			expect(stats.itemCount).toBe(0);
			expect(stats.maxItems).toBe(5);

			engine.cacheGroup('stats-test', 100, 100, () => {});

			stats = engine.getCacheStats();
			expect(stats.itemCount).toBe(1);
			expect(stats.accessOrder).toContain('stats-test');
		});
	});

	describe('Integration with Transform Groups', () => {
		test('should handle nested transform groups with caching', () => {
			const engine = new Engine(mockCanvas, { caching: true });

			engine.startGroup(5, 5);
			engine.startGroup(10, 10);
			expect(engine.offsetX).toBe(15);
			expect(engine.offsetY).toBe(15);

			let insideOffset: { x: number; y: number } | null = null;
			engine.cacheGroup('nested-cache', 100, 100, () => {
				insideOffset = { x: engine.offsetX, y: engine.offsetY };
			});

			expect(insideOffset).toEqual({ x: 0, y: 0 });
			expect(engine.offsetX).toBe(15);
			expect(engine.offsetY).toBe(15);

			// Clean up
			engine.endGroup();
			engine.endGroup();
		});
	});
});
