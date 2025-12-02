import { StateManager } from '@8f4e/state-manager';

import { EventDispatcher } from '../types';
import { encodeUint8ArrayToBase64 } from '../helpers/base64Encoder';
import serializeToProject from '../helpers/projectSerializing/serializeProject';
import serializeToRuntimeReadyProject from '../helpers/projectSerializing/serializeRuntimeReadyProject';

import type { State } from '../types';

export default function projectExport(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onExportProject() {
		if (!state.callbacks.exportProject) {
			console.warn('No exportProject callback provided');
			return;
		}

		const projectToSave = serializeToProject(state);
		const fileName = `${state.projectInfo.title || 'project'}.json`;
		const json = JSON.stringify(projectToSave, null, 2);

		state.callbacks.exportProject(json, fileName).catch(error => {
			console.error('Failed to save project to file:', error);
		});
	}

	async function onExportRuntimeReadyProject() {
		if (!state.callbacks.exportProject) {
			console.warn('No exportProject callback provided');
			return;
		}

		// Check if compiled WASM code is available
		if (!state.compiler.codeBuffer || state.compiler.codeBuffer.length === 0) {
			console.warn('No compiled WebAssembly code available. Please compile your project first.');
			return;
		}

		// Serialize to project format with compiled WASM, memory snapshot, and config
		const runtimeProject = await serializeToRuntimeReadyProject(state, encodeUint8ArrayToBase64);

		const fileName = `${state.projectInfo.title || 'project'}-runtime-ready.json`;
		const json = JSON.stringify(runtimeProject, null, 2);

		state.callbacks.exportProject(json, fileName).catch(error => {
			console.error('Failed to save runtime-ready project to file:', error);
		});
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

	store.subscribe('graphicHelper.selectedCodeBlock.code', onSaveSession);
	events.on('saveSession', onSaveSession);
	events.on('exportProject', onExportProject);
	events.on('exportRuntimeReadyProject', onExportRuntimeReadyProject);
}
