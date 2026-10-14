const projectUrls = import.meta.glob<string>('../../examples/src/projects/**/*.8f4e', {
	query: '?url&no-inline',
	import: 'default',
	eager: true,
});

export function getExampleProjectUrl(path: string): string {
	const url = projectUrls[`../../examples/src/projects/${path}`];
	if (!url) {
		throw new Error(`Example project not found: ${path}`);
	}
	return url;
}
