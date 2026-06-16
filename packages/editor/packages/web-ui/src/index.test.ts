import { createMockState } from '@8f4e/editor-state-testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
	const engine = {
		loadSpriteSheet: vi.fn(),
		render: vi.fn(),
		renderFrame: vi.fn((drawFrame: (timeToRenderMs: number, vertices: number, maxVertices: number) => void) =>
			drawFrame(12.5, 600, 1200)
		),
		resize: vi.fn(),
		setPostProcessEffect: vi.fn(),
		clearPostProcessEffect: vi.fn(),
		setBackgroundEffect: vi.fn(),
		clearBackgroundEffect: vi.fn(),
		clearAllCache: vi.fn(),
		getCacheStats: vi.fn(() => ({ itemCount: 7, maxItems: 50, accessOrder: [] })),
		uploadRgba8Texture: vi.fn(() => ({ texture: {}, width: 128, height: 128, filter: 'nearest' })),
		drawTexture: vi.fn(),
	};

	return {
		engine,
		// biome-ignore lint/complexity/useArrowFunction: Engine is constructed with new in the code under test.
		Engine: vi.fn(function () {
			return engine;
		}),
		drawBackground: vi.fn(),
		drawCodeBlocks: vi.fn(),
		drawConnections: vi.fn(),
		drawContextMenu: vi.fn(),
		drawDialog: vi.fn(),
		drawModeOverlay: vi.fn(),
	};
});

vi.mock('glugglug', () => ({
	Engine: mocks.Engine,
}));

vi.mock('./drawers/drawBackground', () => ({
	default: mocks.drawBackground,
}));

vi.mock('./drawers/codeBlocks', () => ({
	default: mocks.drawCodeBlocks,
}));

vi.mock('./drawers/codeBlocks/widgets/connections', () => ({
	default: mocks.drawConnections,
}));

vi.mock('./drawers/contextMenu', () => ({
	default: mocks.drawContextMenu,
}));

vi.mock('./drawers/dialog', () => ({
	default: mocks.drawDialog,
}));

vi.mock('./drawers/modeOverlay', () => ({
	default: mocks.drawModeOverlay,
}));

describe('web-ui init', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders one frame with the current state on demand', async () => {
		const { default: init } = await import('./index');
		const state = createMockState();
		const memoryViews = {
			int8: new Int8Array(0),
			int16: new Int16Array(0),
			int32: new Int32Array(0),
			uint8: new Uint8Array(0),
			uint16: new Uint16Array(0),
			float32: new Float32Array(0),
			float64: new Float64Array(0),
		};

		const view = await init(state, {} as HTMLCanvasElement, memoryViews, {
			canvas: {} as OffscreenCanvas,
			spriteLookups: {},
			characterWidth: 8,
			characterHeight: 16,
		});

		view.renderFrame();

		const frameState = mocks.drawCodeBlocks.mock.calls.at(-1)?.[1];

		expect(frameState).toBe(state);
		expect(mocks.drawModeOverlay).toHaveBeenCalledWith(mocks.engine, frameState);
	});

	it('emits render stats at the configured frame interval', async () => {
		const performanceNow = vi.spyOn(performance, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1040);
		const { default: init } = await import('./index');
		const state = createMockState();
		const memoryViews = {
			int8: new Int8Array(0),
			int16: new Int16Array(0),
			int32: new Int32Array(0),
			uint8: new Uint8Array(0),
			uint16: new Uint16Array(0),
			float32: new Float32Array(0),
			float64: new Float64Array(0),
		};
		const onRenderStats = vi.fn();

		const view = await init(
			state,
			{} as HTMLCanvasElement,
			memoryViews,
			{
				canvas: {} as OffscreenCanvas,
				spriteLookups: {},
				characterWidth: 8,
				characterHeight: 16,
			},
			{
				onRenderStats,
				renderStatsIntervalFrames: 2,
			}
		);

		view.renderFrame();
		expect(onRenderStats).not.toHaveBeenCalled();

		view.renderFrame();
		expect(onRenderStats).toHaveBeenCalledTimes(1);
		expect(onRenderStats).toHaveBeenCalledWith({
			timeToRenderMs: 12.5,
			fps: 50,
			frameBudgetMs: 20,
			headroomMs: 7.5,
			fpsCapacity: 80,
			quadCount: 100,
			vertexCount: 600,
			maxVertices: 1200,
			vertexUsagePercent: 50,
			cacheItemCount: 7,
			cacheMaxItems: 50,
		});
		performanceNow.mockRestore();
	});

	it('can draw a WebAssembly-generated RGBA8 frame texture', async () => {
		const { default: init } = await import('./index');
		const state = createMockState();
		state.compiler.compiledModules = {
			screen: {
				memory: {
					rgba: {
						byteAddress: 4,
					},
				},
			},
		} as typeof state.compiler.compiledModules;
		const memoryBuffer = new ArrayBuffer(24);
		const memoryViews = {
			int8: new Int8Array(memoryBuffer),
			int16: new Int16Array(memoryBuffer),
			int32: new Int32Array(memoryBuffer),
			uint8: new Uint8Array(memoryBuffer),
			uint16: new Uint16Array(memoryBuffer),
			float32: new Float32Array(memoryBuffer),
			float64: new Float64Array(memoryBuffer),
		};
		memoryViews.uint8.set([1, 2, 3, 4, 5, 6, 7, 8], 4);
		const memory = { buffer: memoryBuffer } as WebAssembly.Memory;
		const codeBuffer = new Uint8Array([1, 2, 3]);
		const renderFrameExport = vi.fn(() => {
			memoryViews.uint8.set([10, 20, 30, 255], 4);
		});
		const instantiateFrameTextureWasm = vi.fn(async () => ({ renderFrame: renderFrameExport }));
		let frameTexture:
			| {
					entry: string;
					target: string;
					width: number;
					height: number;
			  }
			| undefined;
		const canvas = { width: 160, height: 90 } as HTMLCanvasElement;

		const view = await init(
			state,
			canvas,
			memoryViews,
			{
				canvas: {} as OffscreenCanvas,
				spriteLookups: {},
				characterWidth: 8,
				characterHeight: 16,
			},
			{
				getFrameTexture: () => frameTexture,
				getCodeBuffer: () => codeBuffer,
				getMemory: () => memory,
				instantiateFrameTextureWasm,
			}
		);

		view.renderFrame();
		expect(instantiateFrameTextureWasm).not.toHaveBeenCalled();

		frameTexture = {
			entry: 'renderFrame',
			target: 'screen:rgba',
			width: 1,
			height: 1,
		};

		view.renderFrame();
		expect(instantiateFrameTextureWasm).toHaveBeenCalledWith(memory, codeBuffer);
		expect(renderFrameExport).not.toHaveBeenCalled();

		await Promise.resolve();
		view.resize(320, 180);
		view.renderFrame();

		expect(renderFrameExport).toHaveBeenCalledTimes(1);
		expect(mocks.engine.uploadRgba8Texture).toHaveBeenCalledWith(expect.any(Uint8Array), 1, 1, {
			texture: undefined,
			filter: 'nearest',
		});
		const data = mocks.engine.uploadRgba8Texture.mock.calls.at(-1)?.[0] as Uint8Array;
		expect([...data]).toEqual([10, 20, 30, 255]);
		expect(mocks.engine.drawTexture).toHaveBeenCalledWith(
			{ texture: {}, width: 128, height: 128, filter: 'nearest' },
			0,
			0,
			320,
			180
		);
	});
});
