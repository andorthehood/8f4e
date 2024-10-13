import { EventDispatcher } from '../../events';
import { getModuleId } from '../helpers/codeParsers';
import { CodeBlock, CodeBlockGraphicData, EditorSettings, Project, State } from '../types';

function convertGraphicDataToProjectStructure(
	codeBlocks: CodeBlockGraphicData[],
	vGrid: number,
	hGrid: number
): CodeBlock[] {
	return codeBlocks
		.sort((codeBlockA, codeBlockB) => {
			if (codeBlockA.id > codeBlockB.id) {
				return 1;
			} else if (codeBlockA.id < codeBlockB.id) {
				return -1;
			}
			return 0;
		})
		.map(codeBlock => ({
			code: codeBlock.code,
			x: codeBlock.gridX,
			y: codeBlock.gridY,
			isOpen: codeBlock.isOpen,
			viewport:
				codeBlock.codeBlocks.size > 0
					? {
							x: Math.round(codeBlock.x / vGrid),
							y: Math.round(codeBlock.y / hGrid),
							// eslint-disable-next-line
					}
					: undefined,
			codeBlocks:
				codeBlock.codeBlocks.size > 0
					? convertGraphicDataToProjectStructure(Array.from(codeBlock.codeBlocks), vGrid, hGrid)
					: undefined,
		}));
}

export default function loader(state: State, events: EventDispatcher, defaultState: State): void {
	const localProject = JSON.parse(localStorage.getItem('project_' + state.options.localStorageId) ?? '{}') as Project;
	const editorSettings = JSON.parse(
		localStorage.getItem('editorSettings_' + state.options.localStorageId) ?? '{}'
	) as EditorSettings;
	const input = document.createElement('input');
	input.type = 'file';

	state.editorSettings = editorSettings;

	function loadProject({ project: newProject }: { project: Project }) {
		state['project'] = {
			title: '',
			author: '',
			description: '',
			codeBlocks: [],
			viewport: {
				x: 0,
				y: 0,
			},
			runtime: {
				runtime: 'WebWorkerLogicRuntime',
				sampleRate: 50,
			},
			binaryAssets: [],
		};

		Object.keys(newProject).forEach(key => {
			state['project'][key] = newProject[key] || defaultState.project[key];
		});

		state.graphicHelper.baseCodeBlock.codeBlocks.clear();
		state.graphicHelper.activeViewport.viewport.x = state.project.viewport.x * state.graphicHelper.globalViewport.vGrid;
		state.graphicHelper.activeViewport.viewport.y = state.project.viewport.y * state.graphicHelper.globalViewport.hGrid;
		// TODO: make it recursive
		state.project.codeBlocks.forEach(codeBlock => {
			state.graphicHelper.baseCodeBlock.codeBlocks.add({
				width: 0,
				minGridWidth: 32,
				height: 0,
				code: codeBlock.code,
				trimmedCode: codeBlock.code,
				codeColors: [],
				codeToRender: [],
				extras: {
					inputs: new Map(),
					outputs: new Map(),
					debuggers: new Map(),
					switches: new Map(),
					buttons: new Map(),
					pianoKeyboards: new Map(),
					bufferPlotters: new Map(),
					errorMessages: new Map(),
				},
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				id: getModuleId(codeBlock.code) || '',
				gaps: new Map(),
				x: codeBlock.x * state.graphicHelper.globalViewport.vGrid,
				y: codeBlock.y * state.graphicHelper.globalViewport.hGrid,
				offsetX: 0,
				offsetY: 0,
				gridX: codeBlock.x,
				gridY: codeBlock.y,
				isOpen: codeBlock.isOpen,
				padLength: 1,
				// TODO
				parent: state.graphicHelper.baseCodeBlock,
				viewport: {
					x: 0,
					y: 0,
				},
				codeBlocks: new Set(),
			});
		});
		state.graphicHelper.activeViewport.codeBlocks = state.graphicHelper.baseCodeBlock.codeBlocks;

		events.dispatch('destroyRuntimes');

		if (state.project.runtime.sampleRate <= 1000) {
			events.dispatch('initRuntime:WebWorker');
		} else {
			events.dispatch('initRuntime:AudioWorklet');
		}

		events.dispatch('init');
		events.dispatch('saveState');
	}

	state.options.isLocalStorageEnabled
		? loadProject({ project: localProject })
		: loadProject({ project: state.project });

	function onSaveState() {
		if (!state.options.isLocalStorageEnabled) {
			return;
		}

		state.project.codeBlocks = convertGraphicDataToProjectStructure(
			Array.from(state.graphicHelper.baseCodeBlock.codeBlocks),
			state.graphicHelper.globalViewport.vGrid,
			state.graphicHelper.globalViewport.hGrid
		);
		state.project.viewport.x = Math.round(
			state.graphicHelper.activeViewport.viewport.x / state.graphicHelper.globalViewport.vGrid
		);
		state.project.viewport.y = Math.round(
			state.graphicHelper.activeViewport.viewport.y / state.graphicHelper.globalViewport.hGrid
		);

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
				loadProject({ project: JSON.parse(content) });
				events.dispatch('saveState');
			}
		});
	});

	events.on('saveState', onSaveState);
	events.on('open', onOpen);
	events.on('loadProject', loadProject);
}
