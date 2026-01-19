import getBinaryAssetFileName from './getBinaryAssetFileName';
import getBinaryAssetResponse from './getBinaryAssetResponse';

import type { BinaryAssetMeta } from '@8f4e/editor-state';

export default async function fetchBinaryAssets(
	assetStore: Map<string, ArrayBuffer>,
	urls: string[]
): Promise<BinaryAssetMeta[]> {
	const metadata: BinaryAssetMeta[] = [];

	for (const url of urls) {
		try {
			const response = await getBinaryAssetResponse(url);
			if (!response?.ok) {
				console.warn('Failed to fetch binary asset:', url);
				continue;
			}

			const arrayBuffer = await response.arrayBuffer();
			assetStore.set(url, arrayBuffer);

			const contentType = response.headers.get('content-type') || undefined;
			const fileName = getBinaryAssetFileName(url);

			metadata.push({
				url,
				fileName,
				mimeType: contentType,
				sizeBytes: arrayBuffer.byteLength,
				isLoading: false,
				loadedIntoMemory: false,
			});
		} catch (error) {
			console.error('Failed to fetch binary asset:', url, error);
		}
	}

	return metadata;
}
