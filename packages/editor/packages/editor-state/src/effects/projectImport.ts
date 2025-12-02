import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import getModuleId from '../pureHelpers/codeParsers/getModuleId';
import { EMPTY_DEFAULT_PROJECT } from '../types';
import {
	decodeBase64ToUint8Array,
	decodeBase64ToInt32Array,
	decodeBase64ToFloat32Array,
} from '../pureHelpers/base64/base64Decoder';

import type { Project, State } from '../types';

export default function projectImport(store: StateManager<State>, events: EventDispatcher, defaultState: State): void {
	const state = store.getState();

	const projectPromise = Promise.resolve().then(() => {
		if (!state.featureFlags.persistentStorage || !state.callbacks.loadSession) {
			return Promise.resolve().then(() => loadProject({ project: EMPTY_DEFAULT_PROJECT }));
		}

		return state.callbacks
			.loadSession()
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
		state.compiler.compilerOptions.memorySizeBytes = defaultState.compiler.compilerOptions.memorySizeBytes;
		state.compiler.memoryBuffer = new Int32Array();
		state.compiler.memoryBufferFloat = new Float32Array();
		state.compiler.codeBuffer = new Uint8Array();
		state.compiler.compiledModules = {};
		state.compiler.allocatedMemorySize = 0;
		state.compiler.compilationErrors = [];
		state.compiler.isCompiling = false;

		state.projectInfo.title = '';
		state.projectInfo.author = '';
		state.projectInfo.description = '';
		state.binaryAssets = newProject.binaryAssets || [];
		state.compiler.runtimeSettings = defaultState.compiler.runtimeSettings;
		state.compiler.selectedRuntime = defaultState.compiler.selectedRuntime;
		state.graphicHelper.postProcessEffects = newProject.postProcessEffects || [];

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
				state.compiler.codeBuffer = new Uint8Array();
				state.compiler.memoryBuffer = new Int32Array();
				state.compiler.memoryBufferFloat = new Float32Array();
			}
		} else if (newProject.compiledModules) {
			state.compiler.compiledModules = newProject.compiledModules;
		}

		state.graphicHelper.outputsByWordAddress.clear();
		state.graphicHelper.selectedCodeBlock = undefined;
		state.graphicHelper.draggedCodeBlock = undefined;

		state.graphicHelper.codeBlocks.clear();
		state.graphicHelper.nextCodeBlockCreationIndex = 0;
		state.graphicHelper.viewport.x = newProject.viewport.gridCoordinates.x * state.graphicHelper.viewport.vGrid;
		state.graphicHelper.viewport.y = newProject.viewport.gridCoordinates.y * state.graphicHelper.viewport.hGrid;

		newProject.codeBlocks.forEach(codeBlock => {
			const creationIndex = state.graphicHelper.nextCodeBlockCreationIndex;
			state.graphicHelper.nextCodeBlockCreationIndex++;

			state.graphicHelper.codeBlocks.add({
				width: 0,
				minGridWidth: 32,
				height: 0,
				code: codeBlock.code,
				codeColors: [],
				codeToRender: [],
				extras: {
					blockHighlights: [],
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons: [],
					pianoKeyboards: [],
					bufferPlotters: [],
					errorMessages: [],
				},
				cursor: { col: 0, row: 0, x: 0, y: 0 },
				id: getModuleId(codeBlock.code) || '',
				gaps: new Map(),
				x: codeBlock.gridCoordinates.x * state.graphicHelper.viewport.vGrid,
				y: codeBlock.gridCoordinates.y * state.graphicHelper.viewport.hGrid,
				offsetX: 0,
				offsetY: 0,
				lineNumberColumnWidth: 1,
				lastUpdated: Date.now(),
				creationIndex,
				blockType: 'unknown', // Will be updated by blockTypeUpdater effect
			});
		});
		events.dispatch('init');
		events.dispatch('projectLoaded');
		events.dispatch('loadPostProcessEffects', state.graphicHelper.postProcessEffects);
	}

	void projectPromise;

	function onImportProject() {
		if (!state.callbacks.importProject) {
			console.warn('No importProject callback provided');
			return;
		}

		state.callbacks
			.importProject()
			.then(project => {
				loadProject({ project });
			})
			.catch(error => {
				console.error('Failed to load project from file:', error);
			});
	}

	events.on('importProject', onImportProject);
	events.on('loadProject', loadProject);
	events.on('loadProjectBySlug', loadProjectBySlug);
}
