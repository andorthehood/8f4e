import type { State } from '~/types';

import { EventDispatcher } from '~/types';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onLoadBinaryFilesIntoMemory() {
		if (!state.callbacks.loadBinaryFileIntoMemory) {
			console.warn('No loadBinaryFileIntoMemory callback provided');
			return;
		}

		const assets = state.compiledConfig.binaryAssets || [];
		for (const asset of assets) {
			await state.callbacks.loadBinaryFileIntoMemory(asset);
		}
	}

	async function onClearBinaryAssetCache() {
		if (!state.callbacks.clearBinaryAssetCache) {
			console.warn('No clearBinaryAssetCache callback provided');
			return;
		}

		try {
			await state.callbacks.clearBinaryAssetCache();
		} catch (error) {
			console.error('Failed to clear binary asset cache:', error);
		}
	}

	events.on('loadBinaryFilesIntoMemory', onLoadBinaryFilesIntoMemory);
	events.on('clearBinaryAssetCache', onClearBinaryAssetCache);

	return () => {
		events.off('clearBinaryAssetCache', onClearBinaryAssetCache);
	};
}
