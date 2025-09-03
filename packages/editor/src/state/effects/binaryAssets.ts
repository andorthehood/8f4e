import type { State } from '../types';
import { EventDispatcher } from '../../events';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onImportBinaryAsset() {
		if (!state.options.importBinaryAsset) {
			console.warn('No importBinaryAsset callback provided');
			return;
		}

		try {
			const fileHandles = await (
				window as unknown as { showOpenFilePicker: () => Promise<FileSystemFileHandle[]> }
			).showOpenFilePicker();
			const file = await fileHandles[0].getFile();

			const result = await state.options.importBinaryAsset(file);

			if (!state.project.binaryAssets) {
				state.project.binaryAssets = [];
			}
			state.project.binaryAssets.push(result);
			events.dispatch('saveState');
		} catch (error) {
			console.error('Failed to import binary asset:', error);
		}
	}

	events.on('importBinaryAsset', onImportBinaryAsset);

	return () => {
		events.off('importBinaryAsset', onImportBinaryAsset);
	};
}
