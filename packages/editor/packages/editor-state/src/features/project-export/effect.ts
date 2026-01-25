import { StateManager } from '@8f4e/state-manager';

import serializeToProject from './serializeToProject';
import serializeToRuntimeReadyProject from './serializeToRuntimeReadyProject';

import type { State } from '~/types';

import { EventDispatcher } from '~/types';
import encodeUint8ArrayToBase64 from '~/pureHelpers/base64/base64Encoder';

export default function projectExport(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function onExportProject() {
		if (!state.callbacks.exportProject) {
			console.warn('No exportProject callback provided');
			return;
		}

		const projectToSave = serializeToProject(state);
		const fileName = 'project.json';
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

		// Serialize to project format with compiled data, memory snapshot, and config
		const runtimeProject = await serializeToRuntimeReadyProject(state, encodeUint8ArrayToBase64);

		const fileName = 'project-runtime-ready.json';
		const json = JSON.stringify(runtimeProject, null, 2);

		state.callbacks.exportProject(json, fileName).catch(error => {
			console.error('Failed to save runtime-ready project to file:', error);
		});
	}

	async function onSaveSession() {
		if (!state.callbacks.saveSession) {
			return;
		}

		// Serialize current state to Project format
		const projectToSave = serializeToProject(state);

		// Use callbacks instead of localStorage
		await state.callbacks.saveSession(projectToSave);

		if (state.callbacks.getStorageQuota) {
			const storageQuota = await state.callbacks.getStorageQuota();
			if (storageQuota) {
				store.set('storageQuota', storageQuota);
			}
		}
	}

	function onExportWasm() {
		if (!state.callbacks.exportBinaryCode) {
			console.warn('No exportProject callback provided');
			return;
		}

		const projectName = 'project';
		const fileName = `${projectName}.wasm`;

		state.callbacks.exportBinaryCode(fileName).catch(error => {
			console.error('Failed to export WebAssembly file:', error);
		});
	}

	store.subscribe('graphicHelper.codeBlocks', onSaveSession);
	store.subscribe('graphicHelper.selectedCodeBlock.code', onSaveSession);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', onSaveSession);
	events.on('saveSession', onSaveSession);
	events.on('exportProject', onExportProject);
	events.on('exportRuntimeReadyProject', onExportRuntimeReadyProject);
	events.on('exportWasm', onExportWasm);
}
