import type { State } from '~/types';

import { EventDispatcher } from '~/types';
import resolveBinaryAssetTarget from '~/pureHelpers/resolveBinaryAssetTarget';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onLoadBinaryFilesIntoMemory() {
		const assets = state.compiledConfig.binaryAssets || [];

		// Use new two-phase approach if available, otherwise fall back to legacy callback
		if (state.callbacks.fetchBinaryAssets && state.callbacks.loadBinaryAssetIntoMemory) {
			// Phase 1: Fetch all assets and deduplicate URLs
			const uniqueUrls = Array.from(new Set(assets.map(asset => asset.url)));
			const fetchedMeta = await state.callbacks.fetchBinaryAssets(uniqueUrls);

			// Store metadata in state (fetchedMeta already has isLoading=false, loadedIntoMemory=false)
			state.binaryAssets = fetchedMeta;

			// Phase 2: Load each asset into memory at its target location
			for (const asset of assets) {
				const resolved = resolveBinaryAssetTarget(state, asset.memoryId);
				if (!resolved) {
					console.warn('Unable to resolve memory target:', asset.memoryId);
					continue;
				}

				// Find the asset in state and mark as loading
				const stateAsset = state.binaryAssets.find(a => a.url === asset.url);
				if (stateAsset) {
					stateAsset.isLoading = true;
				}

				try {
					await state.callbacks.loadBinaryAssetIntoMemory(asset.url, resolved);

					// Mark as loaded
					if (stateAsset) {
						stateAsset.isLoading = false;
						stateAsset.loadedIntoMemory = true;
					}
				} catch (error) {
					console.error('Failed to load binary asset into memory:', asset.url, error);
					if (stateAsset) {
						stateAsset.isLoading = false;
					}
				}
			}
		} else if (state.callbacks.loadBinaryFileIntoMemory) {
			// Legacy path: single callback that does both fetch and load
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
		} else {
			console.warn('No binary asset loading callbacks provided');
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
