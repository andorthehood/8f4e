import type { BinaryAsset, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { EditorEnvironmentPluginContext } from '../types';
import { resolveBinaryAssetLoadRequests } from './config';
import fetchBinaryAssets from './fetchBinaryAssets';

export default function createBinaryAssetConfigSync({
	store,
	assetStore,
	setErrors,
	isDisposed,
}: {
	store: StateManager<State>;
	assetStore: Map<string, ArrayBuffer>;
	setErrors: EditorEnvironmentPluginContext['setErrors'];
	isDisposed: () => boolean;
}): () => void {
	let lastLoadSignature = '';
	let fetchGeneration = 0;

	async function syncBinaryAssetsFromConfig(): Promise<void> {
		const loadRequests = resolveBinaryAssetLoadRequests(store.getState());
		const nextLoadSignature = loadRequests.map(asset => `${asset.id}|${asset.url}|${asset.memoryId}`).join('\n');
		if (nextLoadSignature === lastLoadSignature) {
			return;
		}
		lastLoadSignature = nextLoadSignature;
		// Only invalidate in-flight fetches when asset config actually changes.
		// Project loads can trigger unrelated updates while a fetch is pending.
		const generation = ++fetchGeneration;
		setErrors([]);

		store.set('binaryAssets', []);

		if (loadRequests.length === 0) {
			return;
		}

		const uniqueUrls: string[] = [];

		for (const asset of loadRequests) {
			if (!uniqueUrls.includes(asset.url)) {
				uniqueUrls.push(asset.url);
			}
		}

		try {
			const fetchedAssets = await fetchBinaryAssets(uniqueUrls, assetStore);
			// Ignore stale fetch results from a previous project/config set.
			if (isDisposed() || generation !== fetchGeneration) {
				return;
			}

			const nextAssets: BinaryAsset[] = [];
			for (const asset of loadRequests) {
				const fetched = fetchedAssets.find(candidate => candidate.url === asset.url);
				if (!fetched) {
					console.warn('Binary asset metadata missing for url:', asset.url);
					continue;
				}

				nextAssets.push({
					...fetched,
					id: asset.id,
					memoryId: asset.memoryId,
					loadedIntoMemory: false,
				});
			}

			store.set('binaryAssets', nextAssets);
		} catch (error) {
			if (!isDisposed() && generation === fetchGeneration) {
				console.error('Failed to fetch binary assets:', error);
			}
		}
	}

	store.subscribe('editorConfig.bin', syncBinaryAssetsFromConfig);

	void syncBinaryAssetsFromConfig();

	return () => {
		fetchGeneration++;
		store.unsubscribe('editorConfig.bin', syncBinaryAssetsFromConfig);
	};
}
