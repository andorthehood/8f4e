import type { BinaryAsset } from '@8f4e/editor-state';
import type { MemoryViews } from '@8f4e/web-ui';

export default async function loadBinaryAssetIntoMemory(
	asset: BinaryAsset,
	assetStore: Map<string, ArrayBuffer>,
	memoryViews: MemoryViews
): Promise<void> {
	const { url, byteAddress, memoryByteLength, memoryId } = asset;
	if (byteAddress === undefined || memoryByteLength === undefined) {
		console.warn('Binary asset missing resolved memory target:', url);
		return;
	}

	const arrayBuffer = assetStore.get(url);
	if (!arrayBuffer) {
		console.warn('Binary asset not found in store:', url);
		return;
	}

	const byteView = new Uint8Array(memoryViews.int32.buffer);
	const maxLength = Math.min(arrayBuffer.byteLength, memoryByteLength);
	const endAddress = byteAddress + maxLength;

	if (endAddress > byteView.byteLength) {
		console.warn('Binary asset exceeds memory bounds:', memoryId ?? url);
		return;
	}

	byteView.set(new Uint8Array(arrayBuffer, 0, maxLength), byteAddress);
}
