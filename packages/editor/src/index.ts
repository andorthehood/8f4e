import initEvents from './events';
import { Options, Project } from './state/types';
import initView from './view';
import initState from './state';

export default async function init(canvas: HTMLCanvasElement, project: Project, options: Partial<Options>) {
	const events = initEvents(canvas);
	const state = initState(events, project, options);
	const view = await initView(state, canvas);

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		state,
	};
}
