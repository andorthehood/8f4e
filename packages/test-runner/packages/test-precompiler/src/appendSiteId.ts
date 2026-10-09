/** Finds the comment boundary without treating semicolons inside quoted strings as comments. */
function getCommentStart(line: string): number {
	let quoted = false;
	for (let index = 0; index < line.length; index++) {
		if (quoted && line[index] === '\\') {
			index++;
		} else if (line[index] === '"') {
			quoted = !quoted;
		} else if (!quoted && line[index] === ';') {
			return index;
		}
	}
	return line.length;
}

/** Appends the ID after all call arguments while keeping every physical source line in place. */
export function appendSiteId(code: string[], lineNumber: number, nextLineNumber: number, siteId: number): void {
	const continuationArguments: string[] = [];
	for (let index = lineNumber + 1; index < nextLineNumber; index++) {
		const line = code[index];
		if (!/^\s*-(?=\s|;|$)/.test(line)) continue;
		continuationArguments.push(line.slice(0, getCommentStart(line)).trim().slice(1).trim());
		code[index] = line.replace(/^(\s*)-/, '$1; -');
	}

	const line = code[lineNumber];
	const commentStart = getCommentStart(line);
	const originalCode = line.slice(0, commentStart);
	const trimmedCode = originalCode.trimEnd();
	const trailingWhitespace = originalCode.slice(trimmedCode.length);
	const comment = line.slice(commentStart);
	const separator = comment ? trailingWhitespace || ' ' : trailingWhitespace;
	code[lineNumber] = `${[trimmedCode, ...continuationArguments, siteId].join(' ')}${separator}${comment}`;
}
