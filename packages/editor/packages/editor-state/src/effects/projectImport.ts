import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import getModuleId from '../pureHelpers/codeParsers/getModuleId';
import { EMPTY_DEFAULT_PROJECT } from '../types';
import {
	decodeBase64ToUint8Array,
	decodeBase64ToInt32Array,
	decodeBase64ToFloat32Array,
} from '../pureHelpers/base64/base64Decoder';
import { log, warn, error } from '../impureHelpers/logger';

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
			.catch(err => {
				console.warn('Failed to load project from storage:', err);
				warn(state, 'Failed to load project from storage');
				loadProject({ project: EMPTY_DEFAULT_PROJECT });
			});
	});

	async function loadProjectBySlug({ projectSlug }: { projectSlug: string }) {
		if (!state.callbacks.getProject) {
			console.warn('No getProject callback provided');
			warn(state, 'No getProject callback provided');
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
		store.set('codeErrors.compilationErrors', []);
		state.compiler.isCompiling = false;

		state.projectInfo.title = '';
		state.projectInfo.author = '';
		state.projectInfo.description = '';
		state.binaryAssets = newProject.binaryAssets || [];
		state.runtime.runtimeSettings = defaultState.runtime.runtimeSettings;
		state.runtime.selectedRuntime = defaultState.runtime.selectedRuntime;
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
				log(state, 'Pre-compiled WASM loaded and decoded successfully', 'Loader');
			} catch (err) {
				console.error('[Loader] Failed to decode pre-compiled WASM:', err);
				error(state, 'Failed to decode pre-compiled WASM', 'Loader');
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

			// Compute grid coordinates first as source of truth
			const gridX = codeBlock.gridCoordinates.x;
			const gridY = codeBlock.gridCoordinates.y;

			// Compute pixel coordinates from grid coordinates
			const pixelX = gridX * state.graphicHelper.viewport.vGrid;
			const pixelY = gridY * state.graphicHelper.viewport.hGrid;

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
				gridX,
				gridY,
				x: pixelX,
				y: pixelY,
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
			warn(state, 'No importProject callback provided');
			return;
		}

		state.callbacks
			.importProject()
			.then(project => {
				loadProject({ project });
			})
			.catch(err => {
				console.error('Failed to load project from file:', err);
				error(state, 'Failed to load project from file');
			});
	}

	events.on('importProject', onImportProject);
	events.on('loadProject', loadProject);
	events.on('loadProjectBySlug', loadProjectBySlug);
}
