import type { ResolvedBinaryAsset } from '@8f4e/editor-state';
import type { MemoryViews } from '@8f4e/web-ui';

export default async function loadBinaryAssetIntoMemory(
	url: string,
	target: ResolvedBinaryAsset,
	assetStore: Map<string, ArrayBuffer>,
	memoryViews: MemoryViews
): Promise<void> {
	const arrayBuffer = assetStore.get(url);
	if (!arrayBuffer) {
		console.warn('Binary asset not found in store:', url);
		return;
	}

	const { byteAddress, byteLength } = target;
	const byteView = new Uint8Array(memoryViews.int32.buffer);
	const maxLength = Math.min(arrayBuffer.byteLength, byteLength);
	const endAddress = byteAddress + maxLength;

	if (endAddress > byteView.byteLength) {
		console.warn('Binary asset exceeds memory bounds:', target.memoryName);
		return;
	}

	byteView.set(new Uint8Array(arrayBuffer, 0, maxLength), byteAddress);
}
