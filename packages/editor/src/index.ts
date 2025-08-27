import initEvents from './events';
import humanInterface from './events/humanInterface';
import { Options, Project } from './state/types';
import initView from './view';
import initState from './state';

// Re-export types that consumers might need
export type { Project, Options, State, EditorSettings, CompilationResult } from './state/types';
export type { RuntimeFactory, RuntimeType } from './state/effects/runtime';
export type { EventDispatcher } from './events';
export type { FeatureFlags, FeatureFlagsConfig } from './config/featureFlags';

export default async function init(canvas: HTMLCanvasElement, project: Project, options: Options) {
	const events = initEvents();
	humanInterface(canvas, events);
	const state = initState(events, project, options);
	const view = await initView(state, canvas);

	events.on('setColorScheme', () => {
		view.reloadSpriteSheet();
		events.dispatch('spriteSheetRerendered');
	});

	events.on('setFont', () => {
		view.reloadSpriteSheet();
		events.dispatch('spriteSheetRerendered');
	});

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		state,
	};
}
