import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onImportBinaryAsset() {
		if (!state.callbacks.importBinaryAsset) {
			console.warn('No importBinaryAsset callback provided');
			return;
		}

		try {
			const fileHandles = await (
				window as unknown as { showOpenFilePicker: () => Promise<FileSystemFileHandle[]> }
			).showOpenFilePicker();
			const file = await fileHandles[0].getFile();

			const result = await state.callbacks.importBinaryAsset(file);

			state.compiler.binaryAssets.push(result);
		} catch (error) {
			console.error('Failed to import binary asset:', error);
		}
	}

	events.on('importBinaryAsset', onImportBinaryAsset);

	return () => {
		events.off('importBinaryAsset', onImportBinaryAsset);
	};
}
