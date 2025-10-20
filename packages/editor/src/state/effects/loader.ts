import { EventDispatcher } from '../../events';
import { getModuleId } from '../helpers/codeParsers';
import { EMPTY_DEFAULT_PROJECT } from '../types';

import type { CodeBlock, CodeBlockGraphicData, Project, State } from '../types';

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
	// Create a fresh copy of editorSettings to avoid shared references
	state.editorSettings = { ...defaultState.editorSettings };
	state.colorSchemes = {}; // Initialize with empty object

	// Load color schemes first
	const colorSchemesPromise = state.callbacks.loadColorSchemes
		? state.callbacks
				.loadColorSchemes()
				.then(colorSchemes => {
					state.colorSchemes = colorSchemes;
				})
				.catch(error => {
					console.warn('Failed to load color schemes:', error);
					state.colorSchemes = {};
				})
		: Promise.resolve();

	const loadEditorSettingsFromStorage = state.callbacks.loadEditorSettingsFromStorage;
	const settingsPromise = colorSchemesPromise.then(() =>
		state.featureFlags.persistentStorage && loadEditorSettingsFromStorage
			? loadEditorSettingsFromStorage()
					.then(editorSettings => {
						if (editorSettings) {
							const previousColorScheme = state.editorSettings.colorScheme;
							const previousFont = state.editorSettings.font;
							state.editorSettings = editorSettings;

							// Dispatch events to reload the view if settings changed
							if (editorSettings.colorScheme !== previousColorScheme) {
								events.dispatch('setColorScheme', { colorScheme: editorSettings.colorScheme });
							}
							if (editorSettings.font !== previousFont) {
								events.dispatch('setFont', { font: editorSettings.font });
							}
						} else {
							state.editorSettings = { ...defaultState.editorSettings };
						}
					})
					.catch(error => {
						console.warn('Failed to load editor settings from storage:', error);
						state.editorSettings = { ...defaultState.editorSettings };
					})
			: Promise.resolve()
	);

	const loadProjectFromStorage = state.callbacks.loadProjectFromStorage;
	const projectPromise = settingsPromise.then(() => {
		if (!state.featureFlags.persistentStorage || !loadProjectFromStorage) {
			return Promise.resolve().then(() => loadProject({ project: EMPTY_DEFAULT_PROJECT }));
		}

		return loadProjectFromStorage()
			.then(localProject => {
				loadProject({ project: localProject || EMPTY_DEFAULT_PROJECT });
			})
			.catch(error => {
				console.warn('Failed to load project from storage:', error);
				loadProject({ project: EMPTY_DEFAULT_PROJECT });
			});
	});

	function loadProject({ project: newProject }: { project: Project }) {
		state['project'] = { ...EMPTY_DEFAULT_PROJECT };

		Object.keys(newProject).forEach(key => {
			(state.project as any)[key] = (newProject as any)[key] || (defaultState.project as any)[key];
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
				lastUpdated: Date.now(),
			});
		});
		state.graphicHelper.activeViewport.codeBlocks = state.graphicHelper.baseCodeBlock.codeBlocks;
		events.dispatch('init');
		events.dispatch('saveProject');
		events.dispatch('projectLoaded');
		events.dispatch('loadPostProcessEffects', state.project.postProcessEffects);
	}

	void projectPromise;

	function onSaveEditorSettings() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorSettingsToStorage) {
			return;
		}

		state.callbacks.saveEditorSettingsToStorage(state.editorSettings);
	}

	function onSaveProject() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveProjectToStorage) {
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
		Promise.all([state.callbacks.saveProjectToStorage!(state.project)]).catch(error => {
			console.error('Failed to save to storage:', error);
		});
	}

	function onOpen() {
		if (!state.callbacks.loadProjectFromFile) {
			console.warn('No loadProjectFromFile callback provided');
			return;
		}

		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.addEventListener('change', event => {
			const file = (event.target as HTMLInputElement).files?.[0];
			if (!file || !state.callbacks.loadProjectFromFile) {
				return;
			}

			state.callbacks
				.loadProjectFromFile(file)
				.then(project => {
					loadProject({ project });
					events.dispatch('saveProject');
				})
				.catch(error => {
					console.error('Failed to load project from file:', error);
				});
		});

		input.click();
	}

	events.on('saveProject', onSaveProject);
	events.on('saveEditorSettings', onSaveEditorSettings);
	events.on('open', onOpen);
	events.on('loadProject', loadProject);
}
