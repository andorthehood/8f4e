import { CachedEngine } from '../src/CachedEngine';

// Mock canvas and WebGL context (same as CachedRenderer tests)
const createMockCanvas = (): { canvas: HTMLCanvasElement; mockGL: Partial<WebGL2RenderingContext> } => {
	const mockGL: Partial<WebGL2RenderingContext> = {
		createTexture: jest.fn(() => ({})),
		createFramebuffer: jest.fn(() => ({})),
		createShader: jest.fn(() => ({})),
		createProgram: jest.fn(() => ({})),
		createBuffer: jest.fn(() => ({})),
		shaderSource: jest.fn(),
		compileShader: jest.fn(),
		getShaderParameter: jest.fn(() => true),
		linkProgram: jest.fn(),
		getProgramParameter: jest.fn(() => true),
		attachShader: jest.fn(), // Missing method
		useProgram: jest.fn(),
		bindBuffer: jest.fn(),
		bufferData: jest.fn(),
		vertexAttribPointer: jest.fn(),
		enableVertexAttribArray: jest.fn(),
		getAttribLocation: jest.fn(() => 0),
		getUniformLocation: jest.fn(() => ({})),
		uniform1f: jest.fn(),
		uniform2f: jest.fn(),
		viewport: jest.fn(),
		clearColor: jest.fn(),
		clear: jest.fn(),
		enable: jest.fn(),
		blendFunc: jest.fn(),
		activeTexture: jest.fn(),
		bindTexture: jest.fn(),
		texImage2D: jest.fn(),
		texParameteri: jest.fn(),
		generateMipmap: jest.fn(),
		bindFramebuffer: jest.fn(),
		framebufferTexture2D: jest.fn(),
		checkFramebufferStatus: jest.fn(() => 36053), // FRAMEBUFFER_COMPLETE
		getParameter: jest.fn((param) => {
			if (param === 2978) return new Int32Array([0, 0, 800, 600]); // VIEWPORT
			if (param === 36006) return null; // FRAMEBUFFER_BINDING
			if (param === 32873) return null; // TEXTURE_BINDING_2D
			if (param === 35725) return null; // CURRENT_PROGRAM
			return null;
		}),
		deleteTexture: jest.fn(),
		deleteFramebuffer: jest.fn(),
		drawArrays: jest.fn(),
		finish: jest.fn(),
		flush: jest.fn(),
		canvas: { width: 800, height: 600 },
		// WebGL constants
		VERTEX_SHADER: 35633,
		FRAGMENT_SHADER: 35632,
		COMPILE_STATUS: 35713,
		LINK_STATUS: 35714,
		ARRAY_BUFFER: 34962,
		STATIC_DRAW: 35044,
		FLOAT: 5126,
		TRIANGLES: 4,
		COLOR_BUFFER_BIT: 16384,
		BLEND: 3042,
		SRC_ALPHA: 770,
		ONE_MINUS_SRC_ALPHA: 771,
		TEXTURE_2D: 3553,
		TEXTURE0: 33984,
		RGBA: 6408,
		UNSIGNED_BYTE: 5121,
		TEXTURE_MIN_FILTER: 10241,
		TEXTURE_MAG_FILTER: 10240,
		TEXTURE_WRAP_S: 10242,
		TEXTURE_WRAP_T: 10243,
		LINEAR: 9729,
		CLAMP_TO_EDGE: 33071,
		FRAMEBUFFER: 36160,
		COLOR_ATTACHMENT0: 36064,
		FRAMEBUFFER_COMPLETE: 36053,
	};

	const canvas = {
		getContext: jest.fn(() => mockGL),
		width: 800,
		height: 600,
	} as unknown as HTMLCanvasElement;

	return { canvas, mockGL };
};

describe('CachedEngine', () => {
	let cachedEngine: CachedEngine;

	beforeEach(() => {
		const { canvas } = createMockCanvas();
		cachedEngine = new CachedEngine(canvas, 5);
	});

	describe('Cache Group Management', () => {
		test('should start and end cache group with offset management', () => {
			// Set initial offsets
			cachedEngine.offsetX = 50;
			cachedEngine.offsetY = 30;

			cachedEngine.startCacheGroup('test-cache', 200, 100);
			
			// Offsets should be reset to 0 when creating new cache
			expect(cachedEngine.offsetX).toBe(0);
			expect(cachedEngine.offsetY).toBe(0);
			expect(cachedEngine.getIsInCacheGroup()).toBe(true);

			cachedEngine.endCacheGroup();
			
			// Offsets should be restored
			expect(cachedEngine.offsetX).toBe(50);
			expect(cachedEngine.offsetY).toBe(30);
			expect(cachedEngine.getIsInCacheGroup()).toBe(false);
		});

		test('should not reset offsets when using existing cache', () => {
			// Create cache first
			cachedEngine.startCacheGroup('test-cache', 200, 100);
			cachedEngine.endCacheGroup();

			// Set offsets
			cachedEngine.offsetX = 100;
			cachedEngine.offsetY = 50;

			// Use existing cache
			cachedEngine.startCacheGroup('test-cache', 200, 100);
			
			// Offsets should remain unchanged when using existing cache
			expect(cachedEngine.offsetX).toBe(100);
			expect(cachedEngine.offsetY).toBe(50);

			cachedEngine.endCacheGroup();
			
			// Offsets should still be unchanged
			expect(cachedEngine.offsetX).toBe(100);
			expect(cachedEngine.offsetY).toBe(50);
		});

		test('should prevent nesting cache groups', () => {
			cachedEngine.startCacheGroup('cache1', 100, 100);
			
			expect(() => {
				cachedEngine.startCacheGroup('cache2', 100, 100);
			}).toThrow('Cannot nest cache groups');
		});
	});

	describe('Drawing Integration', () => {
		test('should work with existing drawing methods', () => {
			// Set up sprite lookup for testing
			cachedEngine.spriteLookup = {
				'test-sprite': { x: 0, y: 0, spriteWidth: 32, spriteHeight: 32 }
			};

			// Test that drawing methods work normally outside cache groups
			expect(() => {
				cachedEngine.drawSprite(10, 10, 'test-sprite');
				cachedEngine.drawText(20, 20, 'Hello');
				cachedEngine.drawLine(0, 0, 100, 100, 'test-sprite', 2);
				cachedEngine.drawRectangle(50, 50, 100, 50, 'test-sprite', 1);
			}).not.toThrow();
		});

		test('should handle drawing within cache groups', () => {
			// Set up sprite lookup
			cachedEngine.spriteLookup = {
				'test-sprite': { x: 0, y: 0, spriteWidth: 32, spriteHeight: 32 }
			};

			// Drawing within cache group should work
			cachedEngine.startCacheGroup('ui-panel', 200, 100);
			
			expect(() => {
				cachedEngine.drawSprite(10, 10, 'test-sprite');
				cachedEngine.drawText(20, 20, 'Test');
			}).not.toThrow();

			cachedEngine.endCacheGroup();
		});
	});

	describe('Cache Management Methods', () => {
		test('should delegate all cache management to renderer', () => {
			// Create some caches
			cachedEngine.startCacheGroup('cache1', 100, 100);
			cachedEngine.endCacheGroup();
			
			cachedEngine.startCacheGroup('cache2', 150, 75);
			cachedEngine.endCacheGroup();

			// Test cache existence
			expect(cachedEngine.getCacheExists('cache1')).toBe(true);
			expect(cachedEngine.getCacheExists('cache2')).toBe(true);
			expect(cachedEngine.getCacheExists('nonexistent')).toBe(false);

			// Test cache count
			expect(cachedEngine.getCacheCount()).toBe(2);

			// Test cache statistics
			const stats = cachedEngine.getCacheStats();
			expect(stats.count).toBe(2);
			expect(stats.maxItems).toBe(5);
			expect(stats.memoryEstimate).toBe((100 * 100 * 4) + (150 * 75 * 4));

			// Test cache clearing
			cachedEngine.clearCache('cache1');
			expect(cachedEngine.getCacheCount()).toBe(1);
			expect(cachedEngine.getCacheExists('cache1')).toBe(false);
			expect(cachedEngine.getCacheExists('cache2')).toBe(true);

			// Test clear all caches
			cachedEngine.clearAllCaches();
			expect(cachedEngine.getCacheCount()).toBe(0);
		});

		test('should handle cache limit changes', () => {
			// Create caches up to limit (5)
			for (let i = 0; i < 5; i++) {
				cachedEngine.startCacheGroup(`cache${i}`, 100, 100);
				cachedEngine.endCacheGroup();
			}

			expect(cachedEngine.getCacheCount()).toBe(5); // At limit

			// Add one more (should evict oldest)
			cachedEngine.startCacheGroup('cache5', 100, 100);
			cachedEngine.endCacheGroup();

			expect(cachedEngine.getCacheCount()).toBe(5); // Still at limit, oldest evicted

			// Change limit (should evict more)
			cachedEngine.setMaxCacheItems(3);
			expect(cachedEngine.getCacheCount()).toBe(3);

			// Increase limit (no immediate effect)
			cachedEngine.setMaxCacheItems(10);
			expect(cachedEngine.getCacheCount()).toBe(3); // Same count, higher limit
		});
	});

	describe('State Management', () => {
		test('should track cache group state correctly', () => {
			expect(cachedEngine.getIsInCacheGroup()).toBe(false);
			expect(cachedEngine.getCurrentCacheId()).toBe(null);

			cachedEngine.startCacheGroup('test-cache', 100, 100);
			
			expect(cachedEngine.getIsInCacheGroup()).toBe(true);
			expect(cachedEngine.getCurrentCacheId()).toBe('test-cache');

			cachedEngine.endCacheGroup();
			
			expect(cachedEngine.getIsInCacheGroup()).toBe(false);
			expect(cachedEngine.getCurrentCacheId()).toBe(null);
		});
	});

	describe('Inheritance Behavior', () => {
		test('should maintain all Engine functionality', () => {
			// Test that all Engine methods are still available
			expect(typeof cachedEngine.startGroup).toBe('function');
			expect(typeof cachedEngine.endGroup).toBe('function');
			expect(typeof cachedEngine.growBuffer).toBe('function');
			expect(typeof cachedEngine.resize).toBe('function');
			expect(typeof cachedEngine.render).toBe('function');
			expect(typeof cachedEngine.drawSprite).toBe('function');
			expect(typeof cachedEngine.drawText).toBe('function');
			expect(typeof cachedEngine.drawLine).toBe('function');
			expect(typeof cachedEngine.drawRectangle).toBe('function');
			expect(typeof cachedEngine.loadSpriteSheet).toBe('function');

			// Test that properties are accessible
			expect(typeof cachedEngine.offsetX).toBe('number');
			expect(typeof cachedEngine.offsetY).toBe('number');
			expect(Array.isArray(cachedEngine.offsetGroups)).toBe(true);
		});

		test('should work with transform groups', () => {
			cachedEngine.startGroup(10, 20);
			
			expect(cachedEngine.offsetX).toBe(10);
			expect(cachedEngine.offsetY).toBe(20);

			// Should be able to use cache groups within transform groups
			cachedEngine.startCacheGroup('test-cache', 100, 100);
			
			// Cache creation resets offsets
			expect(cachedEngine.offsetX).toBe(0);
			expect(cachedEngine.offsetY).toBe(0);

			cachedEngine.endCacheGroup();
			
			// Should restore transform group offsets
			expect(cachedEngine.offsetX).toBe(10);
			expect(cachedEngine.offsetY).toBe(20);

			cachedEngine.endGroup();
			
			expect(cachedEngine.offsetX).toBe(0);
			expect(cachedEngine.offsetY).toBe(0);
		});
	});
});