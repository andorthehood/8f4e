import type { State } from '~/types';

import { EventDispatcher } from '~/types';
import resolveBinaryAssetTarget from '~/pureHelpers/resolveBinaryAssetTarget';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onLoadBinaryFilesIntoMemory() {
		if (!state.callbacks.loadBinaryFileIntoMemory) {
			console.warn('No loadBinaryFileIntoMemory callback provided');
			return;
		}

		const assets = state.compiledConfig.binaryAssets || [];
		for (const asset of assets) {
			const resolved = resolveBinaryAssetTarget(state, asset.memoryId);
			if (!resolved) {
				console.warn('Unable to resolve memory target:', asset.memoryId);
				continue;
			}

			await state.callbacks.loadBinaryFileIntoMemory({
				url: asset.url,
				moduleId: resolved.moduleId,
				memoryName: resolved.memoryName,
				byteAddress: resolved.byteAddress,
				byteLength: resolved.byteLength,
			});
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
