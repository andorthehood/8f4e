import { EventDispatcher } from '../types';

import type { State } from '../types';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onImportBinaryAsset() {
		if (!state.callbacks.importBinaryAsset) {
			console.warn('No importBinaryAsset callback provided');
			return;
		}

		try {
			const result = await state.callbacks.importBinaryAsset();
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
