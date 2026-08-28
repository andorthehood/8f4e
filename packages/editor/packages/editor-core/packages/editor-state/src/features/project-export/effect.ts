import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { registerExportFileNameEditorConfigValidator } from './editorConfig';
import getExportBaseName from './getExportBaseName';
import { serializeProjectTo8f4e } from './serializeTo8f4e';
import serializeToProject from './serializeToProject';

export default function projectExport(store: StateManager<State>, events: EventDispatcher): () => void {
	registerExportFileNameEditorConfigValidator(store);

	const state = store.getState();
	let disposed = false;
	let saveGeneration = 0;

	function onExportProject() {
		if (disposed) {
			return;
		}

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
		if (disposed || !state.callbacks.saveSession) {
			return;
		}

		const generation = ++saveGeneration;
		// Serialize current state to Project format
		const projectToSave = serializeToProject(state);

		// Use callbacks instead of localStorage
		await state.callbacks.saveSession(projectToSave);
		if (disposed || generation !== saveGeneration) {
			return;
		}

		if (state.callbacks.getStorageQuota) {
			const storageQuota = await state.callbacks.getStorageQuota();
			if (!disposed && generation === saveGeneration && storageQuota) {
				store.set('storageQuota', storageQuota);
			}
		}
	}

	function onExportWasm() {
		if (disposed) {
			return;
		}

		if (!state.callbacks.exportBinaryCode) {
			console.warn('No exportBinaryCode callback provided');
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

	return () => {
		disposed = true;
		saveGeneration++;
		store.unsubscribe('codeBlockRendering.codeBlocks', onSaveSession);
		store.unsubscribe('codeBlockRendering.selectedCodeBlock.code', onSaveSession);
		store.unsubscribe('codeBlockRendering.selectedCodeBlockForProgrammaticEdit.code', onSaveSession);
		store.unsubscribe(
			'codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code',
			onSaveSession
		);
		events.off('saveSession', onSaveSession);
		events.off('exportProject', onExportProject);
		events.off('exportWasm', onExportWasm);
	};
}
