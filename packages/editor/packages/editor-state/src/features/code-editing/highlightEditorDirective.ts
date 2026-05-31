/**
 * Finds an editor directive comment segment and highlights only its `@` marker as normal code.
 * The leading semicolon, directive name, and arguments remain in the surrounding comment style.
 */
export default function highlightEditorDirective<T>(
	line: string,
	codeColors: Array<T | undefined>,
	fontCode: T,
	fontCodeComment: T
): void {
	for (const directiveMatch of line.matchAll(/(?:;|\s)@(?=\w+)/g)) {
		if (typeof directiveMatch.index !== 'number') {
			continue;
		}

		const directiveStart = line.indexOf('@', directiveMatch.index);
		if (directiveStart === -1) {
			continue;
		}

		codeColors[directiveStart] = fontCode;
		const directiveNameStart = directiveStart + 1;
		if (directiveNameStart < codeColors.length) {
			codeColors[directiveNameStart] = fontCodeComment;
		}
	}
}
