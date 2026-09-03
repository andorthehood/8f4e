import { createMockState } from '@8f4e/editor-state-testing';
import { MemoryTypes, type PlannedMemoryDeclaration } from '@8f4e/language-spec';
import type { WebUiRenderDataSource } from '@8f4e/web-ui-render-projection';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const renderDataSnapshot = { codeBlocks: new Map() };
const renderData: WebUiRenderDataSource = { getSnapshot: () => renderDataSnapshot };

const mocks = vi.hoisted(() => {
	let frameTextureDrawCallback: ((layer: unknown) => void) | undefined;
	const engine = {
		hooks: {
			preDraw: [] as Array<() => void>,
			postDraw: [] as Array<() => void>,
		},
		frameStats: {
			spriteCount: 100,
			uploadedInstanceBytes: 2000,
		},
		setSpriteAtlas: vi.fn(),
		drawSprite: vi.fn(),
		renderFrame: vi.fn((drawFrame: () => void) => {
			for (const hook of engine.hooks.preDraw) hook();
			drawFrame();
			for (const hook of engine.hooks.postDraw) hook();
		}),
		resize: vi.fn(),
		releaseRenderingMemory: vi.fn(),
		restoreRenderingMemory: vi.fn(),
		destroy: vi.fn(),
	};
	const background = {
		setEffect: vi.fn(),
		clearEffect: vi.fn(),
		destroy: vi.fn(),
	};
	const frameTextureLayer = {
		setDrawCallback: vi.fn((callback: (layer: unknown) => void) => {
			frameTextureDrawCallback = callback;
		}),
		uploadRgba8Texture: vi.fn(() => ({ texture: {}, width: 128, height: 128, filter: 'nearest' })),
		drawTexture: vi.fn(),
		releaseMemory: vi.fn(),
		destroy: vi.fn(),
	};
	const lines = {
		drawLine: vi.fn(),
		releaseMemory: vi.fn(),
		destroy: vi.fn(),
	};
	const postProcess = {
		setEffect: vi.fn(),
		clearEffect: vi.fn(),
		releaseMemory: vi.fn(),
		destroy: vi.fn(),
	};
	const wireColors = {
		wire: [0.1, 0.2, 0.3, 1] as const,
		wireHighlighted: [0.4, 0.5, 0.6, 1] as const,
	};
	const resolveWireColors = vi.fn(() => wireColors);
	const requestAnimationFrame = vi.fn(() => 23);
	const cancelAnimationFrame = vi.fn();

	return {
		engine,
		background,
		frameTextureLayer,
		lines,
		postProcess,
		wireColors,
		resolveWireColors,
		requestAnimationFrame,
		cancelAnimationFrame,
		// biome-ignore lint/complexity/useArrowFunction: Engine is constructed with new in the code under test.
		Engine: vi.fn(function () {
			engine.hooks.preDraw.length = 0;
			engine.hooks.postDraw.length = 0;
			frameTextureDrawCallback = undefined;
			return engine;
		}),
		// biome-ignore lint/complexity/useArrowFunction: Plugins are constructed with new in the code under test.
		ShaderUnderlay: vi.fn(function () {
			return background;
		}),
		// biome-ignore lint/complexity/useArrowFunction: Plugins are constructed with new in the code under test.
		RgbaTextureLayer: vi.fn(function () {
			engine.hooks.preDraw.push(() => frameTextureDrawCallback?.(frameTextureLayer));
			return frameTextureLayer;
		}),
		// biome-ignore lint/complexity/useArrowFunction: Plugins are constructed with new in the code under test.
		LineDrawer: vi.fn(function () {
			return lines;
		}),
		// biome-ignore lint/complexity/useArrowFunction: Plugins are constructed with new in the code under test.
		PostProcess: vi.fn(function () {
			return postProcess;
		}),
		drawBackground: vi.fn(),
		drawCodeBlocks: vi.fn(),
		drawConnections: vi.fn(),
		drawContextMenu: vi.fn(),
		drawDialog: vi.fn(),
		drawModeOverlay: vi.fn(),
	};
});

vi.mock('glugglugglug', () => ({
	Engine: mocks.Engine,
	ShaderUnderlay: mocks.ShaderUnderlay,
	RgbaTextureLayer: mocks.RgbaTextureLayer,
	LineDrawer: mocks.LineDrawer,
	PostProcess: mocks.PostProcess,
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

vi.mock('./wire-colors', () => ({
	resolveWireColors: mocks.resolveWireColors,
}));

function createMemory(overrides: Partial<PlannedMemoryDeclaration> = {}): PlannedMemoryDeclaration {
	return {
		id: 'rgba',
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.int,
		memoryIndex: 0,
		byteAddress: 0,
		elementByteLength: 4,
		wordAlignedSize: 1,
		wordAlignedByteLength: 4,
		wordAlignedAddress: 0,
		endByteAddress: 0,
		endAddressSafeByteLength: 4,
		lineNumber: 1,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

function createSpriteData() {
	return {
		spriteAtlas: {
			image: {} as OffscreenCanvas,
			lookup: {},
			spriteIds: {},
		},
		characterWidth: 8,
		characterHeight: 16,
	};
}

describe('web-ui init', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('requestAnimationFrame', mocks.requestAnimationFrame);
		vi.stubGlobal('cancelAnimationFrame', mocks.cancelAnimationFrame);
	});
	afterEach(() => vi.unstubAllGlobals());

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

		const view = await init(state, renderData, {} as HTMLCanvasElement, memoryViews, createSpriteData());

		view.renderFrame();

		const frameState = mocks.drawCodeBlocks.mock.calls.at(-1)?.[1];
		const frameRenderData = mocks.drawCodeBlocks.mock.calls.at(-1)?.[3];

		expect(frameState).toBe(state);
		expect(frameRenderData).toBe(renderDataSnapshot);
		expect(mocks.resolveWireColors).toHaveBeenCalledWith(state.editorConfig.color);
		expect(mocks.drawConnections).toHaveBeenCalledWith(mocks.lines, mocks.wireColors, frameState, memoryViews);
		expect(mocks.drawModeOverlay).toHaveBeenCalledWith(expect.anything(), frameState);
	});

	it('hides wires while a dialog is visible and restores them when it closes', async () => {
		const { default: init } = await import('./index');
		const state = createMockState({
			dialogStack: [{ id: 'permission', title: 'Permission', text: 'Allow audio?', buttons: [] }],
		});
		const memoryViews = {
			int8: new Int8Array(0),
			int16: new Int16Array(0),
			int32: new Int32Array(0),
			uint8: new Uint8Array(0),
			uint16: new Uint16Array(0),
			float32: new Float32Array(0),
			float64: new Float64Array(0),
		};
		const view = await init(state, renderData, {} as HTMLCanvasElement, memoryViews, createSpriteData());

		expect(mocks.drawConnections).not.toHaveBeenCalled();

		state.dialogStack = [];
		view.renderFrame();

		expect(mocks.drawConnections).toHaveBeenCalledWith(mocks.lines, mocks.wireColors, state, memoryViews);
	});

	it('pauses and resumes its animation frame loop idempotently', async () => {
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
		const view = await init(state, renderData, {} as HTMLCanvasElement, memoryViews, createSpriteData());
		expect(mocks.engine.renderFrame).toHaveBeenCalledOnce();
		expect(mocks.requestAnimationFrame).toHaveBeenCalledOnce();

		view.pauseRendering();
		view.pauseRendering();
		expect(mocks.cancelAnimationFrame).toHaveBeenCalledOnce();
		expect(mocks.cancelAnimationFrame).toHaveBeenCalledWith(23);

		view.resumeRendering();
		view.resumeRendering();
		expect(mocks.engine.renderFrame).toHaveBeenCalledTimes(2);
		expect(mocks.requestAnimationFrame).toHaveBeenCalledTimes(2);

		view.destroy();
		expect(mocks.cancelAnimationFrame).toHaveBeenCalledTimes(2);
		expect(mocks.engine.destroy).toHaveBeenCalledOnce();
	});

	it('releases rendering resources and applies the latest deferred size when resumed', async () => {
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
		const canvas = { width: 640, height: 480 } as HTMLCanvasElement;
		const view = await init(state, renderData, canvas, memoryViews, createSpriteData());

		view.releaseRenderingResources();
		view.releaseRenderingResources();

		expect(mocks.cancelAnimationFrame).toHaveBeenCalledOnce();
		expect(mocks.postProcess.releaseMemory).toHaveBeenCalledOnce();
		expect(mocks.frameTextureLayer.releaseMemory).toHaveBeenCalledOnce();
		expect(mocks.lines.releaseMemory).toHaveBeenCalledOnce();
		expect(mocks.engine.releaseRenderingMemory).toHaveBeenCalledOnce();
		expect(canvas).toEqual(expect.objectContaining({ width: 1, height: 1 }));
		expect(view.resize(800, 600)).toBe(false);
		expect(mocks.engine.resize).not.toHaveBeenCalled();

		view.resumeRendering();

		expect(mocks.engine.restoreRenderingMemory).toHaveBeenCalledOnce();
		expect(mocks.engine.resize).toHaveBeenCalledOnce();
		expect(mocks.engine.resize).toHaveBeenCalledWith(800, 600);
		expect(mocks.engine.renderFrame).toHaveBeenCalledTimes(2);
	});

	it('re-resolves wire colors from the current theme when the atlas is loaded', async () => {
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
		const view = await init(state, renderData, {} as HTMLCanvasElement, memoryViews, createSpriteData());
		const nextColorScheme = {
			fill: {
				wire: '#123456',
				wireHighlighted: '#abcdef',
			},
		};

		state.editorConfig.color = nextColorScheme;
		view.loadSpriteAtlas(createSpriteData());

		expect(mocks.resolveWireColors).toHaveBeenLastCalledWith(nextColorScheme);
	});

	it('emits render stats at the configured frame interval', async () => {
		let now = 0;
		const performanceNow = vi.spyOn(performance, 'now').mockImplementation(() => {
			now += 10;
			return now;
		});
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

		const view = await init(state, renderData, {} as HTMLCanvasElement, memoryViews, createSpriteData(), {
			onRenderStats,
			renderStatsIntervalFrames: 2,
		});
		expect(onRenderStats).not.toHaveBeenCalled();

		view.renderFrame();
		expect(onRenderStats).toHaveBeenCalledTimes(1);
		expect(onRenderStats).toHaveBeenCalledWith({
			timeToRenderMs: 10,
			fps: 40,
			frameBudgetMs: 25,
			headroomMs: 15,
			fpsCapacity: 100,
			spriteCount: 100,
			uploadedInstanceBytes: 2000,
		});

		view.renderFrame();
		expect(onRenderStats).toHaveBeenCalledTimes(1);
		performanceNow.mockRestore();
	});

	it('can draw a WebAssembly-generated RGBA8 frame texture', async () => {
		const { default: init } = await import('./index');
		const state = createMockState();
		const rgba = createMemory({
			byteAddress: 4,
			wordAlignedAddress: 1,
			endByteAddress: 4,
		});
		state.compiler.memoryPlan = {
			modules: {
				screen: {
					id: 'screen',
					lineNumber: 1,
					memoryIndex: 0,
					byteAddress: 4,
					wordAlignedSize: 1,
					wordAlignedByteLength: 4,
					endByteAddress: 4,
					endAddressSafeByteLength: 4,
					memory: {
						rgba,
					},
					declarations: [rgba],
					declarationSources: [],
				},
			},
			moduleList: [],
			nextByteAddressByMemoryIndex: { 0: 8 },
		};
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

		const view = await init(state, renderData, canvas, memoryViews, createSpriteData(), {
			getFrameTexture: () => frameTexture,
			getCodeBuffer: () => codeBuffer,
			getMemory: () => memory,
			instantiateFrameTextureWasm,
		});

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
		expect(mocks.frameTextureLayer.uploadRgba8Texture).toHaveBeenCalledWith(expect.any(Uint8Array), 1, 1, {
			texture: undefined,
			filter: 'nearest',
		});
		const data = mocks.frameTextureLayer.uploadRgba8Texture.mock.calls.at(-1)?.[0] as Uint8Array;
		expect([...data]).toEqual([10, 20, 30, 255]);
		expect(mocks.frameTextureLayer.drawTexture).toHaveBeenCalledWith(
			{ texture: {}, width: 128, height: 128, filter: 'nearest' },
			0,
			0,
			320,
			180
		);
	});
});
