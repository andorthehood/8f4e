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
		const uniqueUrls = Array.from(new Set(assets.map(asset => asset.url)));

		try {
			const fetchedAssets = await state.callbacks.fetchBinaryAssets(uniqueUrls);

			// Store fetched metadata in state
			state.binaryAssets = fetchedAssets;
		} catch (error) {
			console.error('Failed to fetch binary assets:', error);
			return;
		}

		// Step 2: Create a Map for efficient asset lookups by URL
		const assetMap = new Map(state.binaryAssets.map(asset => [asset.url, asset]));

		// Step 3: Load each asset into its resolved memory target
		for (const asset of assets) {
			const resolved = resolveBinaryAssetTarget(state, asset.memoryId);
			if (!resolved) {
				console.warn('Unable to resolve memory target:', asset.memoryId);
				continue;
			}

			// Find the matching asset in state and update loading flag
			const assetInState = assetMap.get(asset.url);
			if (assetInState) {
				assetInState.isLoading = true;
			}

			try {
				await state.callbacks.loadBinaryAssetIntoMemory(asset.url, {
					url: asset.url,
					moduleId: resolved.moduleId,
					memoryName: resolved.memoryName,
					byteAddress: resolved.byteAddress,
					byteLength: resolved.byteLength,
				});

				// Update state to mark as loaded
				if (assetInState) {
					assetInState.isLoading = false;
					assetInState.loadedIntoMemory = true;
				}
			} catch (error) {
				console.error('Failed to load binary asset into memory:', asset.url, error);
				if (assetInState) {
					assetInState.isLoading = false;
				}
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
