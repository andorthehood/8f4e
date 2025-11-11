import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { getModuleId } from '../helpers/codeParsers';
import { EMPTY_DEFAULT_PROJECT } from '../types';
import { serializeToProject } from '../helpers/projectSerializer';
import {
	decodeBase64ToUint8Array,
	decodeBase64ToInt32Array,
	decodeBase64ToFloat32Array,
} from '../helpers/base64Decoder';

import type { Project, State } from '../types';

export default function loader(store: StateManager<State>, events: EventDispatcher, defaultState: State): void {
	const state = store.getState();
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
								store.set('editorSettings.colorScheme', editorSettings.colorScheme);
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

	async function loadProjectBySlug({ projectSlug }: { projectSlug: string }) {
		if (!state.callbacks.getProject) {
			console.warn('No getProject callback provided');
			return;
		}
		const project = await state.callbacks.getProject(projectSlug);
		loadProject({ project });
	}

	function loadProject({ project: newProject }: { project: Project }) {
		// Reset compiler state
		// Use project-specific memory settings if available, otherwise fallback to defaults
		const memorySizeBytes = newProject.memorySizeBytes ?? state.compiler.compilerOptions.memorySizeBytes;
		// Update compiler options to reflect the resolved values
		state.compiler.compilerOptions.memorySizeBytes = memorySizeBytes;
		state.compiler.memoryBuffer = new Int32Array();
		state.compiler.memoryBufferFloat = new Float32Array();
		state.compiler.codeBuffer = new Uint8Array();
		state.compiler.compiledModules = {};
		state.compiler.allocatedMemorySize = 0;
		state.compiler.buildErrors = [];
		state.compiler.isCompiling = false;

		// Populate new state locations
		state.projectInfo.title = newProject.title || '';
		state.projectInfo.author = newProject.author || '';
		state.projectInfo.description = newProject.description || '';
		state.compiler.binaryAssets = newProject.binaryAssets || [];
		state.compiler.runtimeSettings = newProject.runtimeSettings || defaultState.compiler.runtimeSettings;
		state.compiler.selectedRuntime = newProject.selectedRuntime ?? defaultState.compiler.selectedRuntime;
		state.graphicHelper.postProcessEffects = newProject.postProcessEffects || [];

		// If loading a runtime-ready project with pre-compiled WASM, decode it immediately
		if (newProject.compiledWasm && newProject.memorySnapshot) {
			try {
				state.compiler.codeBuffer = decodeBase64ToUint8Array(newProject.compiledWasm);
				state.compiler.memoryBuffer = decodeBase64ToInt32Array(newProject.memorySnapshot);
				state.compiler.memoryBufferFloat = decodeBase64ToFloat32Array(newProject.memorySnapshot);
				state.compiler.allocatedMemorySize = state.compiler.memoryBuffer.byteLength;
				if (newProject.compiledModules) {
					state.compiler.compiledModules = newProject.compiledModules;
				}
				console.log('[Loader] Pre-compiled WASM loaded and decoded successfully');
			} catch (error) {
				console.error('[Loader] Failed to decode pre-compiled WASM:', error);
				// Reset to empty buffers if decoding fails
				state.compiler.codeBuffer = new Uint8Array();
				state.compiler.memoryBuffer = new Int32Array();
				state.compiler.memoryBufferFloat = new Float32Array();
			}
		} else if (newProject.compiledModules) {
			state.compiler.compiledModules = newProject.compiledModules;
		}

		// Clear graphic helper caches that depend on compiler output
		state.graphicHelper.outputsByWordAddress.clear();
		state.graphicHelper.selectedCodeBlock = undefined;
		state.graphicHelper.draggedCodeBlock = undefined;

		state.graphicHelper.activeViewport.codeBlocks.clear();
		state.graphicHelper.activeViewport.viewport.x = newProject.viewport.x * state.graphicHelper.globalViewport.vGrid;
		state.graphicHelper.activeViewport.viewport.y = newProject.viewport.y * state.graphicHelper.globalViewport.hGrid;
		// TODO: make it recursive
		newProject.codeBlocks.forEach(codeBlock => {
			state.graphicHelper.activeViewport.codeBlocks.add({
				width: 0,
				minGridWidth: 32,
				height: 0,
				code: codeBlock.code,
				trimmedCode: codeBlock.code,
				codeColors: [],
				codeToRender: [],
				extras: {
					blockHighlights: [],
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
				padLength: 1,
				viewport: {
					x: 0,
					y: 0,
				},
				codeBlocks: new Set(),
				lastUpdated: Date.now(),
			});
		});
		events.dispatch('init');
		events.dispatch('projectLoaded');
		events.dispatch('loadPostProcessEffects', state.graphicHelper.postProcessEffects);
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

		// Serialize current state to Project format
		const projectToSave = serializeToProject(state);

		// Use callbacks instead of localStorage
		Promise.all([state.callbacks.saveProjectToStorage!(projectToSave)]).catch(error => {
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
	events.on('loadProjectBySlug', loadProjectBySlug);
}
