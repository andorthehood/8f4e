import initEvents from './events';
import humanInterface from './events/humanInterface';
import { EMPTY_DEFAULT_PROJECT } from './state/types';
import initState from './state';

import type { Options } from './state/types';

// Re-export types that consumers might need
export type { Project, Options, State, EditorSettings, CompilationResult, CodeBlockGraphicData } from './state/types';
export type { RuntimeFactory, RuntimeType } from './state/effects/runtime';
export type { EventDispatcher } from './events';
export type { FeatureFlags, FeatureFlagsConfig } from './config/featureFlags';

export default async function init(canvas: HTMLCanvasElement, options: Options) {
	const events = initEvents();
	const store = initState(events, EMPTY_DEFAULT_PROJECT, options);
	const state = store.getState();
	humanInterface(canvas, events, state);

	// Dynamic import to avoid circular build dependency
	const { default: initView } = await import('@8f4e/web-ui');
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
		view.loadPostProcessEffects(state.project.postProcessEffects || []);
	});

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		state,
	};
}
