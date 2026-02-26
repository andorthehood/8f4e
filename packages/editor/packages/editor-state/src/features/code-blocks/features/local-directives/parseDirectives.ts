import type { ParsedDirective } from '~/features/global-directives/types';

export default function parseLocalDirectives(code: string[]): ParsedDirective[] {
	const directives: ParsedDirective[] = [];
	for (let lineIndex = 0; lineIndex < code.length; lineIndex++) {
		const rawLine = code[lineIndex];
		const commentMatch = rawLine.match(/^\s*;\s*@(\w+)(?:\s+(.*))?$/);
		if (!commentMatch) {
			continue;
		}

		const argText = commentMatch[2] ?? null;
		const trimmedArgText = argText?.trim() ?? '';
		const args = trimmedArgText.length > 0 ? trimmedArgText.split(/\s+/) : [];

		directives.push({
			name: commentMatch[1],
			args,
			lineNumber: lineIndex + 1,
			sourceOrder: directives.length,
			rawLine,
			argText,
		});
	}

	return directives;
}
