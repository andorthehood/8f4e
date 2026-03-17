function isReferenceToDeletedModule(token: string, removedModuleIds: Set<string>): boolean {
	for (const moduleId of removedModuleIds) {
		if (token === `&${moduleId}:` || token === `${moduleId}:&`) {
			return true;
		}

		if (
			token.startsWith(`&${moduleId}:`) ||
			token.startsWith(`${moduleId}:`) ||
			token.startsWith(`$${moduleId}.`) ||
			token.startsWith(`%${moduleId}.`) ||
			token.startsWith(`^${moduleId}.`) ||
			token.startsWith(`!${moduleId}.`)
		) {
			return true;
		}
	}

	return false;
}

function removeReferencesFromLine(line: string, removedModuleIds: Set<string>): string {
	const commentStart = line.indexOf(';');
	const codePart = commentStart >= 0 ? line.slice(0, commentStart) : line;
	const commentPart = commentStart >= 0 ? line.slice(commentStart) : '';
	const indentation = codePart.match(/^\s*/)?.[0] ?? '';
	const trimmedCode = codePart.trim();

	if (!trimmedCode) {
		return line;
	}

	const tokens = trimmedCode.split(/\s+/);
	const nextTokens = tokens.filter(
		(token, index) => index === 0 || !isReferenceToDeletedModule(token, removedModuleIds)
	);

	if (nextTokens.length === tokens.length) {
		return line;
	}

	const rebuiltCode = `${indentation}${nextTokens.join(' ')}`.trimEnd();
	if (!commentPart) {
		return rebuiltCode;
	}

	if (!rebuiltCode) {
		return `${indentation}${commentPart}`;
	}

	return `${rebuiltCode} ${commentPart}`;
}

export function removeInterModuleReferences(code: string[], removedModuleIds: Set<string>): string[] {
	if (removedModuleIds.size === 0) {
		return code;
	}

	return code.map(line => removeReferencesFromLine(line, removedModuleIds));
}
