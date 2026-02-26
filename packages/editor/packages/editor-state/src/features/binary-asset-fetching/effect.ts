import parseBinaryAssetDefinitions from './parseBinaryAssetDefinitions';

import { info } from '../logger/logger';

import type { StateManager } from '@8f4e/state-manager';
import type { State, EventDispatcher } from '~/types';

export default function binaryAssetFetching(store: StateManager<State>, events: EventDispatcher): () => void {
	let lastDefinitionSignature = '';

	async function fetchAssetsFromDirectives(): Promise<void> {
		const state = store.getState();
		if (!state.callbacks.fetchBinaryAssets) {
			console.warn('Missing required callback: fetchBinaryAssets');
			return;
		}

		const definitionsById = parseBinaryAssetDefinitions(state.directives);
		const definitions = [...definitionsById.values()];
		const nextDefinitionSignature = definitions.map(def => `${def.id}|${def.url}`).join('\n');
		if (nextDefinitionSignature === lastDefinitionSignature) {
			return;
		}
		lastDefinitionSignature = nextDefinitionSignature;

		if (definitions.length === 0) {
			store.set('binaryAssets', []);
			return;
		}

		info(state, 'Fetching binary assets...', 'BinaryAssets');

		const uniqueUrls: string[] = [];
		for (const definition of definitions) {
			if (!uniqueUrls.includes(definition.url)) {
				uniqueUrls.push(definition.url);
			}
		}

		try {
			const fetchedAssets = await state.callbacks.fetchBinaryAssets(uniqueUrls);
			const nextAssets = definitions
				.map(definition => {
					const fetched = fetchedAssets.find(candidate => candidate.url === definition.url);
					if (!fetched) {
						console.warn('Binary asset metadata missing for url:', definition.url);
						return null;
					}

					return {
						...fetched,
						id: definition.id,
						loadedIntoMemory: false,
					};
				})
				.filter((asset): asset is NonNullable<typeof asset> => asset !== null);

			info(state, 'Binary assets fetched successfully', 'BinaryAssets');
			store.set('binaryAssets', nextAssets);
		} catch (error) {
			console.error('Failed to fetch binary assets:', error);
		}
	}

	async function onClearBinaryAssetCache() {
		const state = store.getState();
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

	fetchAssetsFromDirectives();
	store.subscribe('directives', fetchAssetsFromDirectives);
	events.on('clearBinaryAssetCache', onClearBinaryAssetCache);

	return () => {
		store.unsubscribe('directives', fetchAssetsFromDirectives);
		events.off('clearBinaryAssetCache', onClearBinaryAssetCache);
	};
}
