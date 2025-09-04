import { CachedEngine } from '../src/CachedEngine';
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

describe('CachedEngine', () => {
	let engine: CachedEngine;

	beforeEach(() => {
		jest.clearAllMocks();
		engine = new CachedEngine(mockCanvas, 5);
	});

	describe('Initialization', () => {
		test('should create engine with cached renderer', () => {
			expect(engine).toBeDefined();
			expect(engine.getCacheStats().maxItems).toBe(5);
		});

		test('should inherit all base engine functionality', () => {
			// Test that base engine methods are available
			expect(typeof engine.drawSprite).toBe('function');
			expect(typeof engine.drawLine).toBe('function');
			expect(typeof engine.startGroup).toBe('function');
			expect(typeof engine.endGroup).toBe('function');
		});
	});

	describe('Cache Group Management', () => {
		test('should manage offset state during cache group operations', () => {
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

		test('should handle nested transform groups with cache groups', () => {
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
	});

	describe('Cached Content Drawing', () => {
		test('should draw cached content at specified position', () => {
			// Create a cache
			engine.cacheGroup('ui-panel', 100, 50, () => {});

			// Mock the drawCachedTexture method
			const mockRenderer = (engine as { renderer: CachedRenderer }).renderer;
			const drawSpy = jest.spyOn(mockRenderer, 'drawCachedTexture');

			// Draw cached content
			engine.drawCachedContent('ui-panel', 25, 75);

			expect(drawSpy).toHaveBeenCalledWith(mockTexture, 100, 50, 25, 75);
		});

		test('should apply transform offsets when drawing cached content', () => {
			// Create a cache
			engine.cacheGroup('button', 80, 30, () => {});

			// Set transform offsets
			engine.startGroup(10, 20);

			// Mock the drawCachedTexture method
			const mockRenderer = (engine as { renderer: CachedRenderer }).renderer;
			const drawSpy = jest.spyOn(mockRenderer, 'drawCachedTexture');

			// Draw cached content - should apply offsets
			engine.drawCachedContent('button', 50, 60);

			expect(drawSpy).toHaveBeenCalledWith(mockTexture, 80, 30, 60, 80); // 50+10, 60+20

			engine.endGroup();
		});

		test('should skip drawing non-existent cached content silently', () => {
			const mockRenderer = (engine as { renderer: CachedRenderer }).renderer;
			const drawSpy = jest.spyOn(mockRenderer, 'drawCachedTexture');

			engine.drawCachedContent('non-existent', 0, 0);

			expect(drawSpy).not.toHaveBeenCalled();
		});
	});

	describe('Cache Lookup and Management', () => {
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
	});

	describe('Cache Statistics', () => {
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

	describe('Integration with Base Engine', () => {
		test('should maintain sprite lookup functionality', () => {
			const spriteLookup = {
				'test-sprite': { x: 0, y: 0, spriteWidth: 32, spriteHeight: 32 },
			};

			engine.setSpriteLookup(spriteLookup);
			expect(engine.spriteLookup).toBe(spriteLookup);
		});

		test('should maintain transform group functionality alongside caching', () => {
			// Test normal transform groups work
			engine.startGroup(10, 10);
			expect(engine.offsetX).toBe(10);
			expect(engine.offsetY).toBe(10);

			// Test cache groups work within transform groups
			let insideOffset: { x: number; y: number } | null = null;
			engine.cacheGroup('transform-cache', 100, 100, () => {
				insideOffset = { x: engine.offsetX, y: engine.offsetY };
			});
			expect(insideOffset).toEqual({ x: 0, y: 0 });
			expect(engine.offsetX).toBe(10); // Restored

			engine.endGroup();
			expect(engine.offsetX).toBe(0); // Back to original
		});

		test('should support performance measurement mode', () => {
			engine.isPerformanceMeasurementMode = true;
			expect(engine.isPerformanceMeasurementMode).toBe(true);
		});

		test('should support post-processing effects', () => {
			const testEffect = {
				name: 'test-effect',
				fragmentShader: 'precision mediump float; void main() { gl_FragColor = vec4(1.0); }',
				uniforms: {},
			};

			// Should not throw
			expect(() => {
				engine.addPostProcessEffect(testEffect);
			}).not.toThrow();
		});
	});

	describe('Error Handling', () => {
		test('should handle cache group errors from renderer', () => {
			// Start first cache group and try to nest another
			expect(() => {
				engine.cacheGroup('cache1', 100, 100, () => {
					engine.cacheGroup('cache2', 100, 100, () => {});
				});
			}).toThrow();
		});
	});
});
