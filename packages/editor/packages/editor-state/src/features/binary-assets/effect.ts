import type { State } from '~/types';

import { EventDispatcher } from '~/types';
import resolveBinaryAssetTarget from '~/pureHelpers/resolveBinaryAssetTarget';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onLoadBinaryFilesIntoMemory() {
		if (!state.callbacks.fetchBinaryAssets || !state.callbacks.loadBinaryAssetIntoMemory) {
			console.warn('Missing required callbacks: fetchBinaryAssets or loadBinaryAssetIntoMemory');
			return;
		}

		const assets = state.compiledConfig.binaryAssets || [];

		// Step 1: Deduplicate URLs and fetch all assets
		const uniqueUrls: string[] = [];
		for (const asset of assets) {
			if (!uniqueUrls.includes(asset.url)) {
				uniqueUrls.push(asset.url);
			}
		}

		try {
			const fetchedAssets = await state.callbacks.fetchBinaryAssets(uniqueUrls);

			// Store fetched metadata in state
			state.binaryAssets = fetchedAssets;
		} catch (error) {
			console.error('Failed to fetch binary assets:', error);
			return;
		}

		// Step 2: Load each asset into its resolved memory target
		// Note: `assets` contains ConfigBinaryAsset (url + memoryId from config)
		// while `state.binaryAssets` contains BinaryAsset (metadata stored in state)
		for (const asset of assets) {
			const resolved = resolveBinaryAssetTarget(state, asset.memoryId);
			if (!resolved) {
				console.warn('Unable to resolve memory target:', asset.memoryId);
				continue;
			}

			// Find the matching asset metadata in state using the URL
			const assetInState = state.binaryAssets.find(a => a.url === asset.url);
			if (!assetInState) {
				continue;
			}

			try {
				assetInState.moduleId = resolved.moduleId;
				assetInState.memoryName = resolved.memoryName;
				assetInState.byteAddress = resolved.byteAddress;
				assetInState.byteLength = resolved.byteLength;

				await state.callbacks.loadBinaryAssetIntoMemory(assetInState);

				// Update state to mark as loaded
				assetInState.loadedIntoMemory = true;
			} catch (error) {
				console.error('Failed to load binary asset into memory:', asset.url, error);
			}
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
