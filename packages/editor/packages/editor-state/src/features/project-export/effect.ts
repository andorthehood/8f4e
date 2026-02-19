import { StateManager } from '@8f4e/state-manager';

import serializeToProject from './serializeToProject';
import { serializeProjectTo8f4e } from './serializeTo8f4e';

import type { State } from '~/types';

import { EventDispatcher } from '~/types';

export default function projectExport(store: StateManager<State>, events: EventDispatcher): void {
	const state = store.getState();

	function getExportBaseName(): string {
		const exportFileName = state.compiledProjectConfig.exportFileName;
		if (!exportFileName) {
			return 'project';
		}
		return exportFileName.replace(/\.(json|wasm|8f4e)$/, '');
	}

	function onExportProject() {
		if (!state.callbacks.exportProject) {
			console.warn('No exportProject callback provided');
			return;
		}

		const projectToSave = serializeToProject(state);
		const fileName = `${getExportBaseName()}.8f4e`;

		let text: string;
		try {
			text = serializeProjectTo8f4e(projectToSave);
		} catch (error) {
			console.error('Failed to serialize project:', error);
			return;
		}

		state.callbacks.exportProject(text, fileName).catch(error => {
			console.error('Failed to save project to file:', error);
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

		const fileName = `${getExportBaseName()}.wasm`;

		state.callbacks.exportBinaryCode(fileName).catch(error => {
			console.error('Failed to export WebAssembly file:', error);
		});
	}

	store.subscribe('graphicHelper.codeBlocks', onSaveSession);
	store.subscribe('graphicHelper.selectedCodeBlock.code', onSaveSession);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', onSaveSession);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code', onSaveSession);
	events.on('saveSession', onSaveSession);
	events.on('exportProject', onExportProject);
	events.on('exportWasm', onExportWasm);
}
