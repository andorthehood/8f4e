export default function getBinaryAssetFileName(url: string): string {
	try {
		const parsed = new URL(url, window.location.href);
		const name = parsed.pathname.split('/').filter(Boolean).pop();
		return name || 'binary-asset';
	} catch {
		const parts = url.split('/').filter(Boolean);
		return parts[parts.length - 1] || 'binary-asset';
	}
}
