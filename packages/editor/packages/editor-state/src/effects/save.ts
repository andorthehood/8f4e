import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { encodeUint8ArrayToBase64 } from '../helpers/base64Encoder';
import { serializeToProject } from '../helpers/projectSerializer';

import type { State } from '../types';

export default function save(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();
	function onExportProject() {
		if (!state.callbacks.exportProject) {
			console.warn('No exportProject callback provided');
			return;
		}

		const projectToSave = serializeToProject(state);
		const fileName = `${projectToSave.title || 'project'}.json`;
		const json = JSON.stringify(projectToSave, null, 2);

		state.callbacks.exportProject(json, fileName).catch(error => {
			console.error('Failed to save project to file:', error);
		});
	}

	function onExportRuntimeReadyProject() {
		if (!state.callbacks.exportProject) {
			console.warn('No exportProject callback provided');
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

		const fileName = `${runtimeProject.title || 'project'}-runtime-ready.json`;
		const json = JSON.stringify(runtimeProject, null, 2);

		state.callbacks.exportProject(json, fileName).catch(error => {
			console.error('Failed to save runtime-ready project to file:', error);
		});
	}

	function onSaveEditorSettings() {
		if (!state.featureFlags.persistentStorage || !state.callbacks.saveEditorSettings) {
			return;
		}

		state.callbacks.saveEditorSettings(state.editorSettings);
	}

	async function onSaveSession() {
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

	store.subscribe('editorSettings', onSaveEditorSettings);
	store.subscribe('graphicHelper.selectedCodeBlock.code', onSaveSession);
	events.on('saveSession', onSaveSession);
	events.on('exportProject', onExportProject);
	events.on('exportRuntimeReadyProject', onExportRuntimeReadyProject);
}
