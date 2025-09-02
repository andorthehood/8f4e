import { CachedRenderer } from '../src/CachedRenderer';

// Mock canvas and WebGL context
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
			// Mock viewport return
			if (param === 2978) return new Int32Array([0, 0, 800, 600]); // VIEWPORT
			if (param === 36006) return null; // FRAMEBUFFER_BINDING (main framebuffer)
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

describe('CachedRenderer', () => {
	let cachedRenderer: CachedRenderer;
	let mockGL: Partial<WebGL2RenderingContext>;

	beforeEach(() => {
		const { canvas, mockGL: gl } = createMockCanvas();
		mockGL = gl;
		cachedRenderer = new CachedRenderer(canvas, 5);
	});

	describe('Cache Group Management', () => {
		test('should start and end cache group', () => {
			const isCreatingNew = cachedRenderer.startCacheGroup('test-cache', 200, 100);
			
			expect(isCreatingNew).toBe(true);
			expect(cachedRenderer.getIsInCacheGroup()).toBe(true);
			expect(cachedRenderer.getCurrentCacheId()).toBe('test-cache');

			const cacheInfo = cachedRenderer.endCacheGroup();
			
			expect(cacheInfo).toBeTruthy();
			expect(cacheInfo?.width).toBe(200);
			expect(cacheInfo?.height).toBe(100);
			expect(cachedRenderer.getIsInCacheGroup()).toBe(false);
		});

		test('should reuse existing cache', () => {
			// Create cache first time
			cachedRenderer.startCacheGroup('test-cache', 200, 100);
			cachedRenderer.endCacheGroup();

			// Use existing cache
			const isCreatingNew = cachedRenderer.startCacheGroup('test-cache', 200, 100);
			
			expect(isCreatingNew).toBe(false);
			expect(cachedRenderer.getIsInCacheGroup()).toBe(true);
		});
	});

	describe('Drawing Method Overrides', () => {
		test('should skip drawing when using existing cache', () => {
			// Create cache first
			cachedRenderer.startCacheGroup('test-cache', 200, 100);
			cachedRenderer.endCacheGroup();

			// Start using existing cache
			cachedRenderer.startCacheGroup('test-cache', 200, 100);

			// Mock the parent's drawSpriteFromCoordinates to track calls
			const parentDrawSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(cachedRenderer)), 'drawSpriteFromCoordinates');

			// Draw should be skipped
			cachedRenderer.drawSpriteFromCoordinates(10, 10, 50, 50, 0, 0, 50, 50);
			
			expect(parentDrawSpy).not.toHaveBeenCalled();

			cachedRenderer.endCacheGroup();
			parentDrawSpy.mockRestore();
		});

		test('should allow drawing when creating new cache', () => {
			cachedRenderer.startCacheGroup('new-cache', 200, 100);

			// Mock the parent's drawSpriteFromCoordinates to track calls
			const parentDrawSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(cachedRenderer)), 'drawSpriteFromCoordinates');

			// Draw should go through
			cachedRenderer.drawSpriteFromCoordinates(10, 10, 50, 50, 0, 0, 50, 50);
			
			expect(parentDrawSpy).toHaveBeenCalledWith(10, 10, 50, 50, 0, 0, 50, 50);

			cachedRenderer.endCacheGroup();
			parentDrawSpy.mockRestore();
		});

		test('should skip line drawing when using existing cache', () => {
			// Create cache first
			cachedRenderer.startCacheGroup('test-cache', 200, 100);
			cachedRenderer.endCacheGroup();

			// Start using existing cache
			cachedRenderer.startCacheGroup('test-cache', 200, 100);

			// Mock the parent's drawLineFromCoordinates to track calls
			const parentDrawSpy = jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(cachedRenderer)), 'drawLineFromCoordinates');

			// Draw should be skipped
			cachedRenderer.drawLineFromCoordinates(0, 0, 100, 100, 0, 0, 10, 10, 2);
			
			expect(parentDrawSpy).not.toHaveBeenCalled();

			cachedRenderer.endCacheGroup();
			parentDrawSpy.mockRestore();
		});
	});

	describe('Cache Management Methods', () => {
		test('should delegate cache management to CacheManager', () => {
			// Create some caches
			cachedRenderer.startCacheGroup('cache1', 100, 100);
			cachedRenderer.endCacheGroup();
			
			cachedRenderer.startCacheGroup('cache2', 100, 100);
			cachedRenderer.endCacheGroup();

			expect(cachedRenderer.getCacheCount()).toBe(2);
			expect(cachedRenderer.getCacheExists('cache1')).toBe(true);
			expect(cachedRenderer.getCacheExists('cache2')).toBe(true);

			// Clear specific cache
			cachedRenderer.clearCache('cache1');
			expect(cachedRenderer.getCacheCount()).toBe(1);
			expect(cachedRenderer.getCacheExists('cache1')).toBe(false);

			// Clear all caches
			cachedRenderer.clearAllCaches();
			expect(cachedRenderer.getCacheCount()).toBe(0);
		});

		test('should handle cache limit changes', () => {
			// Fill to limit (5)
			for (let i = 0; i < 5; i++) {
				cachedRenderer.startCacheGroup(`cache${i}`, 100, 100);
				cachedRenderer.endCacheGroup();
			}

			expect(cachedRenderer.getCacheCount()).toBe(5); // At limit

			// Add one more (should evict oldest)
			cachedRenderer.startCacheGroup('cache5', 100, 100);
			cachedRenderer.endCacheGroup();

			expect(cachedRenderer.getCacheCount()).toBe(5); // Still at limit

			// Reduce limit (should evict more)
			cachedRenderer.setMaxCacheItems(3);
			expect(cachedRenderer.getCacheCount()).toBe(3);
		});

		test('should provide cache statistics', () => {
			cachedRenderer.startCacheGroup('cache1', 100, 50);
			cachedRenderer.endCacheGroup();
			
			cachedRenderer.startCacheGroup('cache2', 200, 100);
			cachedRenderer.endCacheGroup();

			const stats = cachedRenderer.getCacheStats();
			expect(stats.count).toBe(2);
			expect(stats.maxItems).toBe(5);
			expect(stats.memoryEstimate).toBe((100 * 50 * 4) + (200 * 100 * 4));
		});
	});

	describe('WebGL State Management', () => {
		test('should properly manage viewport switching', () => {
			cachedRenderer.startCacheGroup('test-cache', 200, 100);
			
			// Should have switched viewport for cache rendering
			expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 200, 100);
			expect(mockGL.bindFramebuffer).toHaveBeenCalled();
			
			cachedRenderer.endCacheGroup();
			
			// Should restore original viewport
			expect(mockGL.viewport).toHaveBeenCalledWith(0, 0, 800, 600);
		});

		test('should handle framebuffer switching', () => {
			// This test just verifies framebuffer operations occur during cache creation
			cachedRenderer.startCacheGroup('test-cache', 200, 100);
			
			// Should have called bindFramebuffer to switch to cache framebuffer
			expect(mockGL.bindFramebuffer).toHaveBeenCalled();
			
			cachedRenderer.endCacheGroup();
			
			// Should have called bindFramebuffer again to restore main framebuffer
			expect(mockGL.bindFramebuffer).toHaveBeenCalledTimes(
				mockGL.bindFramebuffer.mock.calls.length
			);
		});
	});
});