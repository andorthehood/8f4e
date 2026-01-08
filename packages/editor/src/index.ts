import initState, { State } from '@8f4e/editor-state';
import initView, { MemoryViews } from '@8f4e/web-ui';

import initEvents from './events';
import humanInterface from './events/humanInterface';
import { createMemoryViewManager, MemoryRef } from './memoryViewManager';
import { createSpriteSheetManager } from './spriteSheetManager';

// Re-export types that consumers might need
export type {
	Project,
	Options,
	State,
	EditorSettings,
	CompilationResult,
	CodeBlockGraphicData,
	RuntimeFactory,
	RuntimeType,
	FeatureFlags,
	FeatureFlagsConfig,
} from '@8f4e/editor-state';
export type { EventDispatcher } from './events';
export type { MemoryRef } from './memoryViewManager';

export interface Editor {
	resize: (width: number, height: number) => void;
	updateMemoryViews: (memoryRef: MemoryRef) => void;
	getMemoryViews: () => MemoryViews;
	state: State;
}

interface Options {
	featureFlags?: Partial<State['featureFlags']>;
	callbacks: State['callbacks'];
}

export default async function init(canvas: HTMLCanvasElement, options: Options): Promise<Editor> {
	const { memoryViews, updateMemoryViews } = createMemoryViewManager(new ArrayBuffer(0));
	const events = initEvents();
	const store = initState(events, {
		...options,
		callbacks: {
			...options.callbacks,
			getWordFromMemory: (wordAlignedAddress: number) => {
				return memoryViews.int32[wordAlignedAddress] || 0;
			},
			setWordInMemory: (wordAlignedAddress: number, value: number) => {
				memoryViews.int32[wordAlignedAddress] = value;
			},
			readClipboardText: async () => {
				return await navigator.clipboard.readText();
			},
			writeClipboardText: async (text: string) => {
				await navigator.clipboard.writeText(text);
			},
		},
	});
	const state = store.getState();
	humanInterface(canvas, events, state);

	const view = await initView(state, canvas, memoryViews);
	createSpriteSheetManager(store, view, events);

	events.on('loadPostProcessEffects', () => {
		view.loadPostProcessEffects(state.graphicHelper.postProcessEffects);
	});

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		updateMemoryViews,
		getMemoryViews: () => memoryViews,
		state,
	};
}
