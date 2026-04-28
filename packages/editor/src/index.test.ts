import { beforeEach, describe, expect, it, vi } from 'vitest';

const events = {
	dispatch: vi.fn(),
	on: vi.fn(),
	off: vi.fn(),
};

const storeState = {
	globalEditorDirectives: {},
	editorConfig: {},
};

const store = {
	getState: vi.fn(() => storeState),
};

const view = {
	resize: vi.fn(),
	loadSpriteSheet: vi.fn(),
	loadPostProcessEffect: vi.fn(),
	loadBackgroundEffect: vi.fn(),
	clearCache: vi.fn(),
};

vi.mock('@8f4e/editor-state', () => ({
	default: vi.fn(() => store),
}));

vi.mock('@8f4e/web-ui', () => ({
	default: vi.fn(async () => view),
}));

vi.mock('@8f4e/sprite-generator', () => ({
	default: vi.fn(async () => ({
		canvas: {} as OffscreenCanvas,
		spriteLookups: {},
		characterWidth: 8,
		characterHeight: 16,
	})),
}));

vi.mock('./events', () => ({
	default: vi.fn(() => events),
}));

vi.mock('./events/pointerEvents', () => ({
	default: vi.fn(() => () => {}),
}));

vi.mock('./events/keyboardEvents', () => ({
	default: vi.fn(() => () => {}),
}));

vi.mock('./events/keyboardMemoryEvents', () => ({
	default: vi.fn(() => () => {}),
}));

vi.mock('./spriteSheetManager', () => ({
	createSpriteSheetManager: vi.fn(),
}));

vi.mock('./updateStateWithSpriteData', () => ({
	updateStateWithSpriteData: vi.fn(),
}));

describe('editor init', () => {
	beforeEach(() => {
		events.dispatch.mockClear();
		events.on.mockClear();
		events.off.mockClear();
		store.getState.mockClear();
		view.resize.mockClear();
	});

	it('sizes the viewport before loading the session', async () => {
		const { default: init } = await import('./index');
		const canvas = { width: 640, height: 480 } as HTMLCanvasElement;

		await init(canvas, {
			runtimeRegistry: {
				WebWorkerLogicRuntime: {
					id: 'WebWorkerLogicRuntime',
					defaults: {},
					schema: { type: 'object' },
					factory: () => () => {},
				},
			},
			defaultRuntimeId: 'WebWorkerLogicRuntime',
			callbacks: {
				loadSession: async () => null,
			},
		});

		expect(events.dispatch.mock.calls.slice(0, 3)).toEqual([
			['init'],
			['resize', { canvasWidth: 640, canvasHeight: 480 }],
			['loadSession'],
		]);
		expect(view.resize).toHaveBeenCalledWith(640, 480);
	});
});
