import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { registerExportFileNameEditorConfigValidator } from './editorConfig';
import getExportBaseName from './getExportBaseName';
import { serializeProjectTo8f4e } from './serializeTo8f4e';
import serializeToProject from './serializeToProject';

export default function projectExport(store: StateManager<State>, events: EventDispatcher): void {
	registerExportFileNameEditorConfigValidator(store);

	const state = store.getState();

	function onExportProject() {
		if (!state.callbacks.exportProject) {
			console.warn('No exportProject callback provided');
			return;
		}

		const projectToSave = serializeToProject(state);
		const fileName = `${getExportBaseName(state)}.8f4e`;

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

		const fileName = `${getExportBaseName(state)}.wasm`;

		state.callbacks.exportBinaryCode(fileName).catch(error => {
			console.error('Failed to export WebAssembly file:', error);
		});
	}

	store.subscribe('codeBlockRendering.codeBlocks', onSaveSession);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', onSaveSession);
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', onSaveSession);
	store.subscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code', onSaveSession);
	events.on('saveSession', onSaveSession);
	events.on('exportProject', onExportProject);
	events.on('exportWasm', onExportWasm);
}
