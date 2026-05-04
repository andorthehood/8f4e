import fetchBinaryAssets from './fetchBinaryAssets';
import parseBinaryAssetDirectives from './parseBinaryAssetDirectives';
import resolveMemoryId from './resolveMemoryId';

import type { BinaryAsset, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { EditorEnvironmentPluginContext } from '../types';

export default function createBinaryAssetDirectiveSync({
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

	async function syncBinaryAssetsFromDirectives(): Promise<void> {
		const state = store.getState();
		const parsed = parseBinaryAssetDirectives(state.graphicHelper.codeBlocks);
		const loadRequests = parsed.loadDirectives
			.map(loadDirective => {
				const definition = parsed.definitionsById.get(loadDirective.assetId);
				if (!definition) {
					console.warn('Unknown @loadAsset id:', loadDirective.assetId);
					return null;
				}

				const memoryId = resolveMemoryId(loadDirective.memoryRef, loadDirective.moduleId);
				if (!memoryId) {
					console.warn(
						'Invalid @loadAsset memoryRef (must use &memoryRef in module/constants blocks):',
						loadDirective.memoryRef
					);
					return null;
				}

				return {
					id: definition.id,
					url: definition.url,
					memoryId,
				};
			})
			.filter((asset): asset is NonNullable<typeof asset> => asset !== null);

		const nextLoadSignature = loadRequests.map(asset => `${asset.id}|${asset.url}|${asset.memoryId}`).join('\n');
		if (nextLoadSignature === lastLoadSignature) {
			return;
		}
		lastLoadSignature = nextLoadSignature;
		// Only invalidate in-flight fetches when asset directives actually change.
		// Project loads can trigger unrelated code-block updates while a fetch is pending.
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
			// Ignore stale fetch results from a previous project/directive set.
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

	store.subscribe('graphicHelper.codeBlocks', syncBinaryAssetsFromDirectives);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncBinaryAssetsFromDirectives);

	void syncBinaryAssetsFromDirectives();

	return () => {
		fetchGeneration++;
		store.unsubscribe('graphicHelper.codeBlocks', syncBinaryAssetsFromDirectives);
		store.unsubscribe('graphicHelper.selectedCodeBlock.code', syncBinaryAssetsFromDirectives);
	};
}
