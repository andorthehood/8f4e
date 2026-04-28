import initState, { Callbacks, State, RuntimeRegistry } from '@8f4e/editor-state';
import initView, { MemoryViews } from '@8f4e/web-ui';
import generateSprite from '@8f4e/sprite-generator';

import { clearBinaryAssetCache, fetchBinaryAssets, loadBinaryAssetIntoMemory } from './binaryAssets';
import initEvents from './events';
import pointerEvents from './events/pointerEvents';
import keyboardEvents from './events/keyboardEvents';
import keyboardMemoryEvents from './events/keyboardMemoryEvents';
import { createMemoryViewManager, MemoryRef } from './memoryViewManager';
import { createSpriteSheetManager } from './spriteSheetManager';
import { updateStateWithSpriteData } from './updateStateWithSpriteData';

import type { PostProcessEffect, BackgroundEffect } from 'glugglug';

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
	WebWorkerLogicRuntime,
	MainThreadLogicRuntime,
	AudioWorkletRuntime,
	WebWorkerMIDIRuntime,
	FeatureFlags,
	FeatureFlagsConfig,
	EditorMode,
	JSONSchemaLike,
	EditorConfigStorageBlock,
} from '@8f4e/editor-state';
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
	callbacks: Omit<Callbacks, 'getWordFromMemory' | 'setWordInMemory' | 'readClipboardText' | 'writeClipboardText'>;
	runtimeRegistry: RuntimeRegistry;
	defaultRuntimeId: string;
}

export default async function init(canvas: HTMLCanvasElement, options: Options): Promise<Editor> {
	const { memoryViews, updateMemoryViews } = createMemoryViewManager(new ArrayBuffer(0));
	const events = initEvents();
	let store: ReturnType<typeof initState>;

	// Create in-memory store for fetched binary assets
	const binaryAssetStore = new Map<string, ArrayBuffer>();

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
			fetchBinaryAssets: urls => fetchBinaryAssets(urls, binaryAssetStore),
			loadBinaryAssetIntoMemory: asset => loadBinaryAssetIntoMemory(asset, binaryAssetStore, memoryViews),
			clearBinaryAssetCache,
			readClipboardText: async () => {
				return await navigator.clipboard.readText();
			},
			writeClipboardText: async (text: string) => {
				await navigator.clipboard.writeText(text);
			},
			requestAnimationFrame: callback => window.requestAnimationFrame(callback),
			cancelAnimationFrame: id => window.cancelAnimationFrame(id),
		},
	});
	const state = store.getState();
	const cleanupPointer = pointerEvents(canvas, events, state);
	const cleanupKeyboard = keyboardEvents(events, store);
	const cleanupKeyboardMemory = keyboardMemoryEvents(store);

	// Generate sprite data and update state before initializing view
	const spriteData = await generateSprite({
		font: state.editorConfig.font,
		colorScheme: state.editorConfig.color,
	});

	updateStateWithSpriteData(state, spriteData);

	const view = await initView(state, canvas, memoryViews, spriteData);

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
			cleanupKeyboardMemory();
		},
		state,
	};
}
