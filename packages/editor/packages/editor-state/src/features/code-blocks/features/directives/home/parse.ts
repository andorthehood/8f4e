export default function parseHomeDirective(code: string[]): boolean {
	for (const line of code) {
		const commentMatch = line.match(/^\s*;\s*@(\w+)(?:\s|$)/);
		if (commentMatch && commentMatch[1] === 'home') {
			return true;
		}
	}
	return false;
}
