/**
 * Get specific project by URL with forced cache bypass.
 */
export async function getProject(url: string): Promise<string> {
	console.log(`Loading project: ${url}`);
	const requestUrl = `${url}${url.includes('?') ? '&' : '?'}_t=${Date.now()}`;
	const response = await fetch(requestUrl, { cache: 'no-store' });
	if (!response.ok) {
		throw new Error(`Failed to fetch project from ${requestUrl}: HTTP ${response.status}`);
	}
	const text = await response.text();
	console.log(`Loaded project: ${url}`);

	return text;
}
