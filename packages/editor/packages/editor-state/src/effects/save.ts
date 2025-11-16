import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { encodeUint8ArrayToBase64 } from '../helpers/base64Encoder';
import { serializeToProject } from '../helpers/projectSerializer';

import type { State } from '../types';

export default function save(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	function onSave() {
		if (!state.callbacks.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		const projectToSave = serializeToProject(state);
		const filename = `${projectToSave.title || 'project'}.json`;
		const json = JSON.stringify(projectToSave, null, 2);

		state.callbacks.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save project to file:', error);
		});
	}

	function onSaveRuntimeReady() {
		if (!state.callbacks.exportFile) {
			console.warn('No exportFile callback provided');
			return;
		}

		// Check if compiled WASM code is available
		if (!state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0) {
			console.warn('No compiled WebAssembly code available. Please compile your project first.');
			return;
		}

		// Serialize to project format with compiled WASM and memory snapshot
		const runtimeProject = serializeToProject(state, {
			includeCompiled: true,
			encodeToBase64: encodeUint8ArrayToBase64,
		});

		const filename = `${runtimeProject.title || 'project'}-runtime-ready.json`;
		const json = JSON.stringify(runtimeProject, null, 2);

		state.callbacks.exportFile(json, filename, 'application/json').catch(error => {
			console.error('Failed to save runtime-ready project to file:', error);
		});
	}

	function onSaveEditorSettings() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorSettings) {
			return;
		}

		state.callbacks.saveEditorSettings(state.editorSettings);
	}

	async function onSaveProject() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveSession) {
			return;
		}

		// Serialize current state to Project format
		const projectToSave = serializeToProject(state);

		// Use callbacks instead of localStorage
		await state.callbacks.saveSession(projectToSave);

		const storageQuota = await state.callbacks.getStorageQuota!();
		if (storageQuota) {
			store.set('storageQuota', storageQuota);
		}
	}

	store.subscribe('graphicHelper.selectedCodeBlock.code', onSaveProject);
	events.on('saveProject', onSaveProject);
	events.on('saveEditorSettings', onSaveEditorSettings);
	events.on('save', onSave);
	events.on('saveRuntimeReady', onSaveRuntimeReady);
}
