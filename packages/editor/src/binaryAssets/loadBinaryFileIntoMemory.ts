import getBinaryAssetFileName from './getBinaryAssetFileName';
import getBinaryAssetResponse from './getBinaryAssetResponse';

import type { BinaryAsset, ResolvedBinaryAsset, State } from '@8f4e/editor-state';
import type { StateManager } from '@8f4e/state-manager';
import type { MemoryViews } from '@8f4e/web-ui';

export default async function loadBinaryFileIntoMemory(
	store: StateManager<State>,
	memoryViews: MemoryViews,
	asset: ResolvedBinaryAsset
): Promise<void> {
	const { url, moduleId, memoryName, byteAddress, byteLength } = asset;
	if (!url || !moduleId || !memoryName) {
		console.warn('Binary asset missing url or memory target');
		return;
	}

	const response = await getBinaryAssetResponse(url);
	if (!response?.ok) {
		console.warn('Failed to load binary asset:', url);
		return;
	}

	const arrayBuffer = await response.arrayBuffer();
	const state = store.getState();

	const byteView = new Uint8Array(memoryViews.int32.buffer);
	const maxLength = Math.min(arrayBuffer.byteLength, byteLength);
	const endAddress = byteAddress + maxLength;

	if (endAddress > byteView.byteLength) {
		console.warn('Binary asset exceeds memory bounds:', `${moduleId}.${memoryName}`);
		return;
	}

	byteView.set(new Uint8Array(arrayBuffer, 0, maxLength), byteAddress);

	const contentType = response.headers.get('content-type') || undefined;
	const fileName = getBinaryAssetFileName(url);
	const memoryId = `${moduleId}.${memoryName}`;
	const nextAsset: BinaryAsset = {
		fileName,
		url,
		memoryId,
		mimeType: contentType || undefined,
		sizeBytes: arrayBuffer.byteLength,
	};
	const existing = state.binaryAssets.filter(
		loaded => !(loaded.url === nextAsset.url && loaded.memoryId === nextAsset.memoryId)
	);

	store.set('binaryAssets', [...existing, nextAsset]);
}
