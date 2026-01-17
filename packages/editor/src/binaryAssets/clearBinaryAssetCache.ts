import { BINARY_ASSET_CACHE_NAME } from './constants';

export default async function clearBinaryAssetCache(): Promise<void> {
	if (typeof caches === 'undefined') {
		return;
	}

	await caches.delete(BINARY_ASSET_CACHE_NAME);
}
