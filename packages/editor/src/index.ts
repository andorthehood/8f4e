import initView from '@8f4e/web-ui';
import initState from '@8f4e/editor-state';
import { EMPTY_DEFAULT_PROJECT } from '@8f4e/editor-state';

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
export { EMPTY_DEFAULT_PROJECT } from '@8f4e/editor-state';

export default async function init(canvas: HTMLCanvasElement, options: Options) {
	const events = initEvents();
	const store = initState(events, EMPTY_DEFAULT_PROJECT, options);
	const state = store.getState();
	humanInterface(canvas, events, state);
	const view = await initView(state, canvas);

	store.subscribe('editorSettings.colorScheme', () => {
		view.clearCache();
		view.reloadSpriteSheet();
		events.dispatch('spriteSheetRerendered');
	});

	events.on('setFont', () => {
		view.clearCache();
		view.reloadSpriteSheet();
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
