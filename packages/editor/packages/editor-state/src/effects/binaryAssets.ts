import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onImportBinaryAsset() {
		if (!state.callbacks.importBinaryFile) {
			console.warn('No importBinaryFile callback provided');
			return;
		}

		try {
			const result = await state.callbacks.importBinaryFile();
			state.binaryAssets.push(result);
		} catch (error) {
			console.error('Failed to import binary asset:', error);
		}
	}

	async function onLoadBinaryFilesIntoMemory() {
		if (!state.callbacks.loadBinaryFileIntoMemory) {
			console.warn('No loadBinaryFileIntoMemory callback provided');
			return;
		}

		state.binaryAssets.forEach(async asset => {
			state.callbacks.loadBinaryFileIntoMemory!(asset);
		});
	}

	events.on('importBinaryFile', onImportBinaryAsset);
	events.on('loadBinaryFilesIntoMemory', onLoadBinaryFilesIntoMemory);

	return () => {
		events.off('importBinaryFile', onImportBinaryAsset);
	};
}
