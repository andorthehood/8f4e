import type { StateManager } from '@8f4e/state-manager';
import type { State, EventDispatcher } from '~/types';

import resolveBinaryAssetTarget from '~/pureHelpers/resolveBinaryAssetTarget';

export default function binaryAssets(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();

	async function fetchAssetsForConfig(): Promise<void> {
		if (!state.callbacks.fetchBinaryAssets) {
			console.warn('Missing required callback: fetchBinaryAssets');
			return;
		}

		const assets = state.compiledConfig.binaryAssets || [];
		const uniqueUrls: string[] = [];

		for (const asset of assets) {
			if (!uniqueUrls.includes(asset.url)) {
				uniqueUrls.push(asset.url);
			}
		}

		try {
			const fetchedAssets = await state.callbacks.fetchBinaryAssets(uniqueUrls);
			const nextAssets = assets
				.map(asset => {
					const fetched = fetchedAssets.find(candidate => candidate.url === asset.url);
					if (!fetched) {
						console.warn('Binary asset metadata missing for url:', asset.url);
						return null;
					}

					return {
						...fetched,
						memoryId: asset.memoryId,
						loadedIntoMemory: false,
					};
				})
				.filter((asset): asset is NonNullable<typeof asset> => asset !== null);

			store.set('binaryAssets', nextAssets);
		} catch (error) {
			console.error('Failed to fetch binary assets:', error);
		}
	}

	async function onLoadBinaryFilesIntoMemory() {
		if (!state.callbacks.loadBinaryAssetIntoMemory) {
			console.warn('Missing required callback: loadBinaryAssetIntoMemory');
			return;
		}

		for (const asset of state.binaryAssets) {
			if (!asset.memoryId) {
				continue;
			}

			const resolved = resolveBinaryAssetTarget(state, asset.memoryId);
			if (!resolved) {
				console.warn('Unable to resolve memory target:', asset.memoryId);
				continue;
			}

			try {
				asset.byteAddress = resolved.byteAddress;
				asset.memoryByteLength = resolved.memoryByteLength;
				await state.callbacks.loadBinaryAssetIntoMemory(asset);
				asset.loadedIntoMemory = true;
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

	store.subscribe('compiledConfig', fetchAssetsForConfig);
	events.on('loadBinaryFilesIntoMemory', onLoadBinaryFilesIntoMemory);
	events.on('clearBinaryAssetCache', onClearBinaryAssetCache);

	return () => {
		store.unsubscribe('compiledConfig', fetchAssetsForConfig);
		events.off('loadBinaryFilesIntoMemory', onLoadBinaryFilesIntoMemory);
		events.off('clearBinaryAssetCache', onClearBinaryAssetCache);
	};
}
