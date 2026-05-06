import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockState } from '@8f4e/editor-state-testing';

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
	};

	return {
		engine,
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
			quadCount: 100,
			vertexCount: 600,
			maxVertices: 1200,
			vertexUsagePercent: 50,
			graphicLoadPercent: 62.5,
			cacheItemCount: 7,
			cacheMaxItems: 50,
		});
		performanceNow.mockRestore();
	});
});
