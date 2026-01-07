import initState, { type Options } from '@8f4e/editor-state';
import initView from '@8f4e/web-ui';

import initEvents from './events';
import humanInterface from './events/humanInterface';
import { createMemoryViewManager, type MemoryRef } from './memoryViewManager';

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

export default async function init(canvas: HTMLCanvasElement, options: Options) {
	const memoryRef: MemoryRef = { current: new ArrayBuffer(0) };

	const { memoryViews, refreshMemoryViews } = createMemoryViewManager(memoryRef);
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
		},
	});
	const state = store.getState();
	humanInterface(canvas, events, state);

	// Update memoryRef whenever compiler produces a new memory buffer
	store.subscribe('compiler.memoryBuffer', () => {
		refreshMemoryViews();
	});

	refreshMemoryViews();

	const view = await initView(state, canvas, memoryViews);

	store.subscribe('colorScheme', () => {
		view.reloadSpriteSheet();
		view.clearCache();
		events.dispatch('spriteSheetRerendered');
	});

	store.subscribe('editorSettings.font', () => {
		view.reloadSpriteSheet();
		view.clearCache();
		events.dispatch('spriteSheetRerendered');
	});

	events.on('loadPostProcessEffects', () => {
		view.loadPostProcessEffects(state.graphicHelper.postProcessEffects);
	});

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		state,
	};
}
