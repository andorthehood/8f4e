import getBinaryAssetFileName from './getBinaryAssetFileName';
import getBinaryAssetResponse from './getBinaryAssetResponse';

import type { BinaryAsset } from '@8f4e/editor-state';

export default async function fetchBinaryAssets(
	urls: string[],
	assetStore: Map<string, ArrayBuffer>
): Promise<BinaryAsset[]> {
	const assets: BinaryAsset[] = [];

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

			assets.push({
				url,
				fileName,
				mimeType: contentType,
				sizeBytes: arrayBuffer.byteLength,
				loadedIntoMemory: false,
			});
		} catch (error) {
			console.error('Error fetching binary asset:', url, error);
		}
	}

	return assets;
}
