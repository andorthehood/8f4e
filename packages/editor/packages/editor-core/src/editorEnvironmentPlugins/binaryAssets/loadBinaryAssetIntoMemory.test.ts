import type { BinaryAsset } from '@8f4e/editor-state-types';
import type { MemoryViews } from '@8f4e/web-ui';
import { describe, expect, it } from 'vitest';
import loadBinaryAssetIntoMemory from './loadBinaryAssetIntoMemory';

describe('loadBinaryAssetIntoMemory', () => {
	it('does not write beyond the allocated target length', async () => {
		const buffer = new ArrayBuffer(40);
		const bytes = new Uint8Array(buffer);
		bytes.fill(0xff);
		const assetBuffer = new Uint8Array(12);
		assetBuffer.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		const asset: BinaryAsset = {
			url: 'https://example.com/value.bin',
			fileName: 'value.bin',
			assetByteLength: assetBuffer.byteLength,
			loadedIntoMemory: true,
			byteAddress: 24,
			memoryByteLength: 8,
			memoryId: 'samples:value',
		};

		await loadBinaryAssetIntoMemory(asset, new Map([[asset.url, assetBuffer.buffer]]), {
			int32: new Int32Array(buffer),
		} as MemoryViews);

		expect([...bytes.slice(24, 32)]).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
		expect([...bytes.slice(32, 36)]).toEqual([0xff, 0xff, 0xff, 0xff]);
	});
});
