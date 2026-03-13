export default function parseDisabledDirective(code: string[]): boolean {
	for (const line of code) {
		const commentMatch = line.match(/^\s*;\s*@(\w+)(?:\s|$)/);
		if (commentMatch && commentMatch[1] === 'disabled') {
			return true;
		}
	}
	return false;
}
