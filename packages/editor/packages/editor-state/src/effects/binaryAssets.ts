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
			state.compiler.binaryAssets.push(result);
		} catch (error) {
			console.error('Failed to import binary asset:', error);
		}
	}

	events.on('importBinaryFile', onImportBinaryAsset);

	return () => {
		events.off('importBinaryFile', onImportBinaryAsset);
	};
}
