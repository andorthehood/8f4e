import loadBinaryAssetIntoMemory from './loadBinaryAssetIntoMemory';

import type { BinaryAsset, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { MemoryViews } from '@8f4e/web-ui';

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
		const state = store.getState();

		for (const asset of assets) {
			if (!asset.memoryId || asset.assetByteLength === undefined) {
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

	function loadPendingBinaryFilesIntoMemory(): void {
		const state = store.getState();
		void loadBinaryFilesIntoMemory(state.binaryAssets.filter(asset => !asset.loadedIntoMemory));
	}

	function reloadBinaryFilesIntoMemory(): void {
		void loadBinaryFilesIntoMemory(store.getState().binaryAssets);
	}

	store.subscribe('binaryAssets', loadPendingBinaryFilesIntoMemory);
	store.subscribe('compiler.compiledModules', reloadBinaryFilesIntoMemory);

	loadPendingBinaryFilesIntoMemory();

	return () => {
		store.unsubscribe('binaryAssets', loadPendingBinaryFilesIntoMemory);
		store.unsubscribe('compiler.compiledModules', reloadBinaryFilesIntoMemory);
	};
}
