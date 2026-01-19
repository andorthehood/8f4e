import type { BinaryAssetTarget } from '@8f4e/editor-state';
import type { MemoryViews } from '@8f4e/web-ui';

export default async function loadBinaryAssetIntoMemory(
	assetStore: Map<string, ArrayBuffer>,
	memoryViews: MemoryViews,
	url: string,
	target: BinaryAssetTarget
): Promise<void> {
	const { moduleId, memoryName, byteAddress, byteLength } = target;

	const arrayBuffer = assetStore.get(url);
	if (!arrayBuffer) {
		console.warn('Binary asset not found in store:', url);
		return;
	}

	const byteView = new Uint8Array(memoryViews.int32.buffer);
	const maxLength = Math.min(arrayBuffer.byteLength, byteLength);
	const endAddress = byteAddress + maxLength;

	if (endAddress > byteView.byteLength) {
		console.warn('Binary asset exceeds memory bounds:', `${moduleId}.${memoryName}`);
		return;
	}

	byteView.set(new Uint8Array(arrayBuffer, 0, maxLength), byteAddress);
}
