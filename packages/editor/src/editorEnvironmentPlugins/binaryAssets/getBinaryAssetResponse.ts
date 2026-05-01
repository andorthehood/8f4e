import { BINARY_ASSET_CACHE_NAME } from './constants';

export default async function getBinaryAssetResponse(url: string): Promise<Response | null> {
	try {
		if (typeof caches === 'undefined') {
			return await fetch(url);
		}

		const cache = await caches.open(BINARY_ASSET_CACHE_NAME);
		const cached = await cache.match(url);
		if (cached) {
			return cached;
		}

		const response = await fetch(url);
		if (response.ok) {
			await cache.put(url, response.clone());
		}
		return response;
	} catch (error) {
		console.warn('Failed to fetch binary asset:', error);
		return null;
	}
}
