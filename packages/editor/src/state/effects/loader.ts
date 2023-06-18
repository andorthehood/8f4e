import { EventDispatcher } from '../../events';
import { getModuleId } from '../helpers/codeParsers';
import { EditorSettings, Project, State } from '../types';

export default function loader(state: State, events: EventDispatcher, defaultState: State): void {
	const localProject = JSON.parse(localStorage.getItem('project_' + state.options.localStorageId) ?? '{}') as Project;
	const editorSettings = JSON.parse(
		localStorage.getItem('editorSettings_' + state.options.localStorageId) ?? '{}'
	) as EditorSettings;
	const input = document.createElement('input');
	input.type = 'file';

	state.editorSettings = editorSettings;

	function loadProject(newProject: Project) {
		Object.keys(newProject).forEach(key => {
			state['project'][key] = newProject[key] || defaultState.project[key];
		});

		state.project.modules.forEach(module => {
			state.graphicHelper.modules.add({
				width: 0,
				height: 0,
				code: module.code,
				codeWithLineNumbers: [],
				codeColors: [],
				codeToRender: [],
				inputs: new Map(),
				outputs: new Map(),
				debuggers: new Map(),
				switches: new Map(),
				scopes: new Map(),
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				id: getModuleId(module.code) || '',
				gaps: new Map(),
				errorMessages: new Map(),
				x: module.x,
				y: module.y,
				isOpen: module.isOpen,
				isGroup: false,
				padLength: 1,
			});
		});
	}

	state.options.isLocalStorageEnabled ? loadProject(localProject) : loadProject(state.project);

	function onSaveState() {
		if (!state.options.isLocalStorageEnabled) {
			return;
		}

		state.project.modules = [];

		for (const graphicData of state.graphicHelper.modules) {
			state.project.modules.push({
				code: graphicData.code,
				x: graphicData.x,
				y: graphicData.y,
				isOpen: graphicData.isOpen,
			});
		}

		localStorage.setItem('project_' + state.options.localStorageId, JSON.stringify(state.project));
		localStorage.setItem('editorSettings_' + state.options.localStorageId, JSON.stringify(state.editorSettings));
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
