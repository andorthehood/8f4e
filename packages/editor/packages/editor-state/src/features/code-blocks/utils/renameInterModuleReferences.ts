function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function renameInterModuleReferences(code: string[], oldId: string, newId: string): string[] {
	if (!oldId || !newId || oldId === newId) {
		return code;
	}

	const escapedOldId = escapeRegex(oldId);
	const identifierBoundary = '(^|[^a-zA-Z0-9_-])';
	const startAddressPattern = new RegExp(`${identifierBoundary}&${escapedOldId}:`, 'g');
	const endAddressPattern = new RegExp(`${identifierBoundary}${escapedOldId}:(?=[^\\s]*&)`, 'g');
	const functionQueryPattern = new RegExp(`(\\b(?:count|sizeof|max|min)\\()${escapedOldId}:`, 'g');

	return code.map(line => {
		return line
			.replace(startAddressPattern, `$1&${newId}:`)
			.replace(endAddressPattern, `$1${newId}:`)
			.replace(functionQueryPattern, `$1${newId}:`);
	});
}
