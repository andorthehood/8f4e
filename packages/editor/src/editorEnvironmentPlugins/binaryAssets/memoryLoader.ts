import type { BinaryAsset, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { MemoryViews } from '@8f4e/web-ui';
import loadBinaryAssetIntoMemory from './loadBinaryAssetIntoMemory';

function resolveBinaryAssetTarget(
	state: State,
	memoryId: string
): { memoryId: string; byteAddress: number; memoryByteLength: number } | null {
	const [moduleId, memoryName] = memoryId.split(':');
	if (!moduleId || !memoryName) {
		return null;
	}

	const memory = state.compiler.memoryPlan.modules[moduleId]?.memory[memoryName];
	if (!memory) {
		return null;
	}

	return {
		memoryId,
		byteAddress: memory.byteAddress,
		memoryByteLength: memory.wordAlignedSize * 4,
	};
}

function getBinaryAssetKey(asset: BinaryAsset): string {
	return `${asset.id ?? ''}\u0000${asset.url}\u0000${asset.memoryId ?? ''}`;
}

export default function createBinaryAssetMemoryLoader({
	store,
	memoryViews,
	assetStore,
}: {
	store: StateManager<State>;
	memoryViews: MemoryViews;
	assetStore: Map<string, ArrayBuffer>;
}): () => void {
	async function loadBinaryFilesIntoMemory(assets: BinaryAsset[]): Promise<void> {
		const loadedAssets = new Map<string, BinaryAsset>();

		for (const asset of assets) {
			if (!asset.memoryId || asset.assetByteLength === undefined) {
				continue;
			}

			const state = store.getState();
			const resolved = resolveBinaryAssetTarget(state, asset.memoryId);
			if (!resolved) {
				console.warn('Unable to resolve memory target:', asset.memoryId);
				continue;
			}

			try {
				const loadedAsset = {
					...asset,
					byteAddress: resolved.byteAddress,
					memoryByteLength: resolved.memoryByteLength,
					loadedIntoMemory: true,
				};
				await loadBinaryAssetIntoMemory(loadedAsset, assetStore, memoryViews);
				loadedAssets.set(getBinaryAssetKey(asset), loadedAsset);
			} catch (error) {
				console.error('Failed to load binary asset into memory:', asset.url, error);
			}
		}

		if (loadedAssets.size === 0) {
			return;
		}

		let changed = false;
		const nextAssets = store.getState().binaryAssets.map(asset => {
			const loadedAsset = loadedAssets.get(getBinaryAssetKey(asset));
			if (!loadedAsset) {
				return asset;
			}

			changed = true;
			return {
				...asset,
				byteAddress: loadedAsset.byteAddress,
				memoryByteLength: loadedAsset.memoryByteLength,
				loadedIntoMemory: true,
			};
		});

		if (changed) {
			store.set('binaryAssets', nextAssets);
		}
	}

	function loadPendingBinaryFilesIntoMemory(): void {
		const state = store.getState();
		void loadBinaryFilesIntoMemory(state.binaryAssets.filter(asset => !asset.loadedIntoMemory));
	}

	function reloadBinaryFilesIntoMemory(): void {
		void loadBinaryFilesIntoMemory(store.getState().binaryAssets);
	}

	store.subscribe('binaryAssets', loadPendingBinaryFilesIntoMemory);
	store.subscribe('compiler.memoryPlan', reloadBinaryFilesIntoMemory);

	loadPendingBinaryFilesIntoMemory();

	return () => {
		store.unsubscribe('binaryAssets', loadPendingBinaryFilesIntoMemory);
		store.unsubscribe('compiler.memoryPlan', reloadBinaryFilesIntoMemory);
	};
}
