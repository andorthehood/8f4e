type NamedProjectBlockKeyword = 'entry' | 'group';

/**
 * Reads and validates the single required name from a named project block opener.
 *
 * @param line - Project block opener line to parse.
 * @param lineNumber - One-based source line number for diagnostics.
 * @param keyword - Project block keyword whose name is being parsed.
 * @returns The parsed project block name.
 */
export function getProjectBlockName(line: string, lineNumber: number, keyword: NamedProjectBlockKeyword): string {
	const [, ...args] = line.trim().split(/\s+/);
	const [blockName] = args;
	if (!blockName || args.length !== 1) {
		throw new Error(`Parse error at line ${lineNumber}: ${keyword} requires exactly one name`);
	}
	return blockName;
}

/**
 * Checks whether a project line can be skipped between project-level blocks.
 *
 * @param trimmedLine - Trimmed project line to inspect.
 * @returns True when the line is blank or a project-level comment.
 */
export function isProjectGapLine(trimmedLine: string): boolean {
	return (
		trimmedLine === '' || trimmedLine.startsWith('#') || trimmedLine.startsWith(';') || trimmedLine.startsWith('//')
	);
}
