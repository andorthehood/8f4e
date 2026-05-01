import fetchBinaryAssets from './fetchBinaryAssets';
import loadBinaryAssetIntoMemory from './loadBinaryAssetIntoMemory';
import parseBinaryAssetDirectives from './parseBinaryAssetDirectives';

import type { BinaryAsset, State } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';

function resolveMemoryId(memoryRef: string, moduleId?: string): string | undefined {
	if (!memoryRef.startsWith('&')) {
		return undefined;
	}

	const withoutPrefix = memoryRef.slice(1);
	if (withoutPrefix.length === 0) {
		return undefined;
	}

	if (withoutPrefix.includes(':')) {
		return withoutPrefix;
	}

	if (!moduleId) {
		return undefined;
	}

	return `${moduleId}:${withoutPrefix}`;
}

function resolveBinaryAssetTarget(
	state: State,
	memoryId: string
): { memoryId: string; byteAddress: number; memoryByteLength: number } | null {
	const [moduleId, memoryName] = memoryId.split(':');
	if (!moduleId || !memoryName) {
		return null;
	}

	const memory = state.compiler.compiledModules[moduleId]?.memoryMap[memoryName];
	if (!memory) {
		return null;
	}

	return {
		memoryId,
		byteAddress: memory.byteAddress,
		memoryByteLength: memory.wordAlignedSize * 4,
	};
}

export default function binaryAssetsPlugin({
	store,
	memoryViews,
	setErrors,
}: EditorEnvironmentPluginContext): () => void {
	const assetStore = new Map<string, ArrayBuffer>();
	let disposed = false;
	let lastLoadSignature = '';
	let fetchGeneration = 0;

	async function fetchAssetsFromDirectives(): Promise<void> {
		const generation = ++fetchGeneration;
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
		setErrors([]);

		if (loadRequests.length === 0) {
			store.set('binaryAssets', []);
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
			if (disposed || generation !== fetchGeneration) {
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
			if (!disposed && generation === fetchGeneration) {
				console.error('Failed to fetch binary assets:', error);
			}
		}
	}

	async function onLoadBinaryFilesIntoMemory(): Promise<void> {
		const state = store.getState();
		const allOfTheAssetsHaveBeenLoaded = !state.binaryAssets.some(asset => !asset.loadedIntoMemory);

		if (!state.compiler.hasMemoryBeenReinitialized && allOfTheAssetsHaveBeenLoaded) {
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
				await loadBinaryAssetIntoMemory(asset, assetStore, memoryViews);
				asset.loadedIntoMemory = true;
			} catch (error) {
				console.error('Failed to load binary asset into memory:', asset.url, error);
			}
		}
	}

	store.subscribe('graphicHelper.codeBlocks', fetchAssetsFromDirectives);
	store.subscribe('graphicHelper.selectedCodeBlock.code', fetchAssetsFromDirectives);
	store.subscribe('binaryAssets', onLoadBinaryFilesIntoMemory);
	store.subscribe('compiler.hasMemoryBeenReinitialized', onLoadBinaryFilesIntoMemory);

	void fetchAssetsFromDirectives();
	void onLoadBinaryFilesIntoMemory();

	return () => {
		disposed = true;
		fetchGeneration++;
		store.unsubscribe('graphicHelper.codeBlocks', fetchAssetsFromDirectives);
		store.unsubscribe('graphicHelper.selectedCodeBlock.code', fetchAssetsFromDirectives);
		store.unsubscribe('binaryAssets', onLoadBinaryFilesIntoMemory);
		store.unsubscribe('compiler.hasMemoryBeenReinitialized', onLoadBinaryFilesIntoMemory);
		assetStore.clear();
		setErrors([]);
		store.set('binaryAssets', []);
	};
}
