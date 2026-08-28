function getCacheBustedUrl(url: string): string {
	return `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
}

export async function fetchRegistryJson<T>(url: string): Promise<T> {
	const requestUrl = getCacheBustedUrl(url);
	const response = await fetch(requestUrl, { cache: 'no-store' });

	if (!response.ok) {
		throw new Error(`Failed to fetch registry from ${requestUrl}: HTTP ${response.status}`);
	}

	return (await response.json()) as T;
}
