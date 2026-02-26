import parseBinaryAssetDefinitions from '../binary-asset-fetching/parseBinaryAssetDefinitions';
import parseBinaryAssetLoads from '../binary-asset-loading/parseBinaryAssetLoads';
import { info } from '../logger/logger';

import type { StateManager } from '@8f4e/state-manager';
import type { State, EventDispatcher } from '~/types';

import resolveBinaryAssetTarget from '~/pureHelpers/resolveBinaryAssetTarget';

export default function binaryAssets(store: StateManager<State>, events: EventDispatcher): () => void {
	let lastLoadSignature = '';

	function resolveMemoryId(memoryRef: string, codeBlockId: string): string | undefined {
		if (!memoryRef.startsWith('&')) {
			return undefined;
		}

		const withoutPrefix = memoryRef.slice(1);
		if (withoutPrefix.length === 0) {
			return undefined;
		}

		if (withoutPrefix.includes('.')) {
			return withoutPrefix;
		}

		return `${codeBlockId}.${withoutPrefix}`;
	}

	async function fetchAssetsFromDirectives(): Promise<void> {
		const state = store.getState();

		if (!state.callbacks.fetchBinaryAssets) {
			console.warn('Missing required callback: fetchBinaryAssets');
			return;
		}

		const definitionsById = parseBinaryAssetDefinitions(state.graphicHelper.codeBlocks);
		const loadDirectives = parseBinaryAssetLoads(state.graphicHelper.codeBlocks);
		const loadRequests = loadDirectives
			.map(loadDirective => {
				const definition = definitionsById.get(loadDirective.assetId);
				if (!definition) {
					console.warn('Unknown @loadAsset id:', loadDirective.assetId);
					return null;
				}

				const memoryId = resolveMemoryId(loadDirective.memoryRef, loadDirective.codeBlockId);
				if (!memoryId) {
					console.warn('Invalid @loadAsset memoryRef (must use &memoryRef):', loadDirective.memoryRef);
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

		if (loadRequests.length === 0) {
			store.set('binaryAssets', []);
			return;
		}

		info(state, 'Fetching binary assets...', 'BinaryAssets');

		const uniqueUrls: string[] = [];

		for (const asset of loadRequests) {
			if (!uniqueUrls.includes(asset.url)) {
				uniqueUrls.push(asset.url);
			}
		}

		try {
			const fetchedAssets = await state.callbacks.fetchBinaryAssets(uniqueUrls);
			const nextAssets = loadRequests
				.map(asset => {
					const fetched = fetchedAssets.find(candidate => candidate.url === asset.url);
					if (!fetched) {
						console.warn('Binary asset metadata missing for url:', asset.url);
						return null;
					}

					return {
						...fetched,
						id: asset.id,
						memoryId: asset.memoryId,
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

	async function onLoadBinaryFilesIntoMemory() {
		const state = store.getState();
		const allOfTheAssetsHaveBeenLoaded = !state.binaryAssets.some(asset => !asset.loadedIntoMemory);

		if (!state.compiler.hasMemoryBeenReinitialized && allOfTheAssetsHaveBeenLoaded) {
			return;
		}

		info(state, 'Loading binary assets into memory...', 'BinaryAssets');

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

	store.subscribe('graphicHelper.codeBlocks', fetchAssetsFromDirectives);
	store.subscribe('graphicHelper.selectedCodeBlock.code', fetchAssetsFromDirectives);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', fetchAssetsFromDirectives);
	store.subscribe('binaryAssets', onLoadBinaryFilesIntoMemory);
	store.subscribe('compiler.hasMemoryBeenReinitialized', onLoadBinaryFilesIntoMemory);
	events.on('clearBinaryAssetCache', onClearBinaryAssetCache);

	return () => {
		store.unsubscribe('graphicHelper.codeBlocks', fetchAssetsFromDirectives);
		store.unsubscribe('graphicHelper.selectedCodeBlock.code', fetchAssetsFromDirectives);
		store.unsubscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', fetchAssetsFromDirectives);
		store.unsubscribe('binaryAssets', onLoadBinaryFilesIntoMemory);
		store.unsubscribe('compiler.hasMemoryBeenReinitialized', onLoadBinaryFilesIntoMemory);
		events.off('clearBinaryAssetCache', onClearBinaryAssetCache);
	};
}
