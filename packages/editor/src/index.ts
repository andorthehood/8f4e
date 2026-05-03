import initState from '@8f4e/editor-state';
import initView, { MemoryViews } from '@8f4e/web-ui';
import generateSprite from '@8f4e/sprite-generator';

import initEvents from './events';
import pointerEvents from './events/pointerEvents';
import keyboardEvents from './events/keyboardEvents';
import { createEditorEnvironmentPluginManager } from './editorEnvironmentPlugins/manager';
import { createMemoryViewManager, MemoryRef } from './memoryViewManager';
import { createSpriteSheetManager } from './spriteSheetManager';
import { updateStateWithSpriteData } from './updateStateWithSpriteData';

import type { PostProcessEffect, BackgroundEffect } from 'glugglug';
import type { Callbacks, State, RuntimeRegistry } from '@8f4e/editor-state-types';

// Re-export types that consumers might need
export type {
	Project,
	Options,
	State,
	CodeError,
	CompilationResult,
	CodeBlockGraphicData,
	ParsedDirectiveRecord,
	RuntimeFactory,
	RuntimeRegistry,
	RuntimeRegistryEntry,
	RuntimeValuesByRuntimeId,
	WebWorkerRuntime,
	MainThreadRuntime,
	AudioWorkletRuntime,
	FeatureFlags,
	FeatureFlagsConfig,
	EditorMode,
	JSONSchemaLike,
	EditorConfigStorageBlock,
} from '@8f4e/editor-state-types';
export type { EventDispatcher } from './events';
export type { MemoryRef } from './memoryViewManager';

// Re-export helper functions
export { updateStateWithSpriteData } from './updateStateWithSpriteData';

export interface Editor {
	resize: (width: number, height: number) => void;
	updateMemoryViews: (memoryRef: MemoryRef) => void;
	getMemoryViews: () => MemoryViews;
	dispose: () => void;
	state: State;
}

interface Options {
	featureFlags?: Partial<State['featureFlags']>;
	callbacks: Omit<
		Callbacks,
		'getWordFromMemory' | 'setWordInMemory' | 'readClipboardText' | 'writeClipboardText' | 'exportCanvasScreenshot'
	> & {
		exportCanvasScreenshot?: (blob: Blob, fileName: string) => Promise<void>;
	};
	runtimeRegistry: RuntimeRegistry;
	defaultRuntimeId: string;
}

async function getCanvasPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(result => {
			if (!result) {
				reject(new Error('Failed to encode canvas as PNG'));
				return;
			}

			resolve(result);
		}, 'image/png');
	});
}

export default async function init(canvas: HTMLCanvasElement, options: Options): Promise<Editor> {
	const { memoryViews, updateMemoryViews } = createMemoryViewManager(new ArrayBuffer(0));
	const events = initEvents();
	let store: ReturnType<typeof initState>;
	let view: Awaited<ReturnType<typeof initView>>;
	const exportCanvasScreenshot = options.callbacks.exportCanvasScreenshot;

	store = initState(events, {
		...options,
		callbacks: {
			...options.callbacks,
			getWordFromMemory: (wordAlignedAddress: number) => {
				return memoryViews.int32[wordAlignedAddress] || 0;
			},
			setWordInMemory: (wordAlignedAddress: number, value: number, isInteger: boolean) => {
				if (isInteger) {
					memoryViews.int32[wordAlignedAddress] = value;
					return;
				}
				memoryViews.float32[wordAlignedAddress] = value;
			},
			readClipboardText: async () => {
				return await navigator.clipboard.readText();
			},
			writeClipboardText: async (text: string) => {
				await navigator.clipboard.writeText(text);
			},
			exportCanvasScreenshot: exportCanvasScreenshot
				? async (fileName: string) => {
						view.renderFrame({
							featureFlags: {
								modeOverlay: false,
								offscreenBlockArrows: false,
							},
						});
						await exportCanvasScreenshot(await getCanvasPngBlob(canvas), fileName);
					}
				: undefined,
			requestAnimationFrame: callback => window.requestAnimationFrame(callback),
			cancelAnimationFrame: id => window.cancelAnimationFrame(id),
		},
	});
	const state = store.getState();
	const cleanupPointer = pointerEvents(canvas, events, state);
	const cleanupKeyboard = keyboardEvents(events, store);
	const browserWindow = canvas.ownerDocument?.defaultView ?? globalThis.window;
	const cleanupEditorEnvironmentPlugins = createEditorEnvironmentPluginManager(store, events, {
		window: browserWindow as Window,
		navigator: browserWindow?.navigator ?? globalThis.navigator,
		memoryViews,
	});

	// Generate sprite data and update state before initializing view
	const spriteData = await generateSprite({
		font: state.editorConfig.font,
		colorScheme: state.editorConfig.color,
	});

	updateStateWithSpriteData(state, spriteData);

	view = await initView(state, canvas, memoryViews, spriteData);

	createSpriteSheetManager(store, view, events);

	events.on<PostProcessEffect | null>('loadPostProcessEffect', effect => {
		view.loadPostProcessEffect(effect);
	});
	events.on<BackgroundEffect | null>('loadBackgroundEffect', effect => {
		view.loadBackgroundEffect(effect);
	});

	events.dispatch('init');
	events.dispatch('resize', {
		canvasWidth: canvas.width,
		canvasHeight: canvas.height,
	});
	view.resize(canvas.width, canvas.height);
	events.dispatch('loadSession');

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		updateMemoryViews,
		getMemoryViews: () => memoryViews,
		dispose: () => {
			cleanupPointer();
			cleanupKeyboard();
			cleanupEditorEnvironmentPlugins();
		},
		state,
	};
}
