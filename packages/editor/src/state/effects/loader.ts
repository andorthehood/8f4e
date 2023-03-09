import { EventDispatcher } from '../../events';
import { Project, State } from '../types';

export default function loader(state: State, events: EventDispatcher, defaultState: State): void {
	const localProject = JSON.parse(localStorage.getItem('project_' + state.options.localStorageId) ?? '{}') as Project;
	const input = document.createElement('input');
	input.type = 'file';

	function loadProject(newProject: Project) {
		Object.keys(newProject).forEach(key => {
			state['project'][key] = newProject[key] || defaultState.project[key];
		});
	}

	state.options.isLocalStorageEnabled && loadProject(localProject);

	state.history = [];

	function onSaveState() {
		state.options.isLocalStorageEnabled &&
			localStorage.setItem('project_' + state.options.localStorageId, JSON.stringify(state.project));
	}

	function onOpen() {
		input.click();
	}

	input.addEventListener('change', event => {
		// @ts-ignore
		const file = event.target.files[0];

		// setting up the reader
		const reader = new FileReader();
		reader.readAsText(file, 'UTF-8');

		reader.addEventListener('load', readerEvent => {
			const content = readerEvent.target?.result?.toString();
			if (content) {
				loadProject(JSON.parse(content));
				events.dispatch('saveState');
			}
		});
	});

	events.on('saveState', onSaveState);
	events.on('open', onOpen);
}
