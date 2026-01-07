import initView, { type MemoryRef } from '@8f4e/web-ui';
import initState from '@8f4e/editor-state';

import initEvents from './events';
import humanInterface from './events/humanInterface';

import type { Options } from '@8f4e/editor-state';

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
export type { MemoryRef } from '@8f4e/web-ui';

export default async function init(canvas: HTMLCanvasElement, options: Options) {
	const events = initEvents();
	const store = initState(events, options);
	const state = store.getState();
	humanInterface(canvas, events, state);

	// Create a stable memory ref that web-ui will read from
	const memoryRef: MemoryRef = { current: null };

	// Update memoryRef whenever compiler produces a new memory buffer
	store.subscribe('compiler.memoryBuffer', () => {
		// The memoryBuffer is an Int32Array which has an underlying buffer
		memoryRef.current = state.compiler.memoryBuffer.buffer;
	});

	// Initialize memoryRef with current state
	memoryRef.current = state.compiler.memoryBuffer.buffer;

	const view = await initView(state, canvas, memoryRef);

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
