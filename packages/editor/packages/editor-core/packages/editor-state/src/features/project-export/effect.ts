import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import { registerExportFileNameEditorConfigValidator } from './editorConfig';
import getExportBaseName from './getExportBaseName';
import loadProjectFormatter from './loadProjectFormatter';
import serializeToProject from './serializeToProject';

export default function projectExport(
	store: StateManager<State>,
	events: EventDispatcher,
	loadFormatter = loadProjectFormatter
): () => void {
	registerExportFileNameEditorConfigValidator(store);

	const state = store.getState();
	let disposed = false;

	async function onExportProject() {
		if (disposed) return;
		const { exportProject, prepareProjectExport } = state.callbacks;
		if (!exportProject && !prepareProjectExport) {
			console.warn('No exportProject callback provided');
			return;
		}

		try {
			// Session serialization retains live code arrays; export needs an independent snapshot.
			const projectToSave = structuredClone(serializeToProject(state));
			const fileName = `${getExportBaseName(state)}.8f4e`;
			// Invoke preparation in the input handler's turn, before loading any code.
			const save = prepareProjectExport
				? await prepareProjectExport(fileName)
				: (text: string) => exportProject!(text, fileName);
			if (!save || disposed) return;

			const { serializeProjectTo8f4e } = await loadFormatter();
			if (disposed) return;
			await save(serializeProjectTo8f4e(projectToSave));
		} catch (error) {
			if (!disposed && !(error instanceof Error && error.name === 'AbortError')) {
				console.error('Failed to save project to file:', error);
			}
		}
	}

	async function onSaveSession() {
		if (disposed || !state.callbacks.saveSession) {
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
		if (disposed) return;
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

	return () => {
		disposed = true;
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
