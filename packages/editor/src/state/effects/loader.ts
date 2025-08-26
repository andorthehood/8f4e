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
	// Initialize with loading project and settings from storage if callbacks are provided
	let initialLoad: Promise<void>;
	if (state.options.loadProjectFromStorage && state.options.loadEditorSettingsFromStorage && state.featureFlags.persistentStorage) {
		initialLoad = Promise.all([
			state.options.loadProjectFromStorage(state.options.localStorageId),
			state.options.loadEditorSettingsFromStorage(state.options.localStorageId)
		]).then(([localProject, editorSettings]) => {
			state.editorSettings = editorSettings || defaultState.editorSettings;
			loadProject({ project: localProject || state.project });
		}).catch(error => {
			console.warn('Failed to load from storage:', error);
			state.editorSettings = defaultState.editorSettings;
			loadProject({ project: state.project });
		});
	} else {
		state.editorSettings = defaultState.editorSettings;
		initialLoad = Promise.resolve().then(() => loadProject({ project: state.project }));
	}

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
			selectedRuntime: 0,
			runtimeSettings: [
				{
					runtime: 'WebWorkerLogicRuntime',
					sampleRate: 50,
				},
			],
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
		events.dispatch('init');
		events.dispatch('saveState');
	}

	void initialLoad;

	function onSaveState() {
		if (!state.featureFlags.persistentStorage || !state.options.saveProjectToStorage || !state.options.saveEditorSettingsToStorage) {
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

		// Use callbacks instead of localStorage
		Promise.all([
			state.options.saveProjectToStorage!(state.options.localStorageId, state.project),
			state.options.saveEditorSettingsToStorage!(state.options.localStorageId, state.editorSettings)
		]).catch(error => {
			console.error('Failed to save to storage:', error);
		});
	}

	function onOpen() {
		if (!state.options.loadProjectFromFile) {
			console.warn('No loadProjectFromFile callback provided');
			return;
		}

		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		
		input.addEventListener('change', event => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (!file || !state.options.loadProjectFromFile) {
				return;
			}

			state.options.loadProjectFromFile(file)
				.then(project => {
					loadProject({ project });
					events.dispatch('saveState');
				})
				.catch(error => {
					console.error('Failed to load project from file:', error);
				});
		});

		input.click();
	}

	events.on('saveState', onSaveState);
	events.on('open', onOpen);
	events.on('loadProject', loadProject);
}
