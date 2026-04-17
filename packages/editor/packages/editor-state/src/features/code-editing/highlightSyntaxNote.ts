import highlightEditorDirective from './highlightEditorDirective';

/**
 * Generates a 2D lookup where each cell contains the sprite used to render a code character.
 * Plain note blocks render their body as comment text, while `note` and `noteEnd` remain
 * instruction-highlighted.
 * @param code Program text split into lines (raw code without line numbers).
 * @param spriteLookups Mapping of syntax roles to sprite identifiers.
 * @returns A matrix of sprite identifiers aligned to every character in the document.
 */
export default function highlightSyntaxNote<T>(
	code: string[],
	spriteLookups: {
		fontLineNumber: T;
		fontInstruction: T;
		fontCode: T;
		fontCodeComment: T;
		fontNumbers: T;
		fontBinaryZero: T;
		fontBinaryOne: T;
		fontBasePrefix: T;
	}
): T[][] {
	return code.map(line => {
		const trimmedLine = line.trim();
		const codeColors = new Array(line.length).fill(undefined);

		if (trimmedLine === 'note' || trimmedLine === 'noteEnd') {
			const keywordIndex = line.indexOf(trimmedLine);
			if (keywordIndex !== -1) {
				codeColors[keywordIndex] = spriteLookups.fontInstruction;
				const endIndex = keywordIndex + trimmedLine.length;
				if (endIndex < line.length) {
					codeColors[endIndex] = spriteLookups.fontCode;
				}
			}
			return codeColors;
		}

		if (line.length > 0) {
			codeColors[0] = spriteLookups.fontCodeComment;
		}
		highlightEditorDirective(line, codeColors, spriteLookups.fontCode, spriteLookups.fontCodeComment);

		return codeColors;
	});
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const spriteLookups = {
		fontLineNumber: 'line',
		fontInstruction: 'instruction',
		fontCode: 'code',
		fontCodeComment: 'comment',
		fontNumbers: 'number',
		fontBinaryZero: 'zero',
		fontBinaryOne: 'one',
		fontBasePrefix: 'prefix',
	} as const;

	describe('highlightSyntaxNote', () => {
		it('renders note bodies as comments while keeping note delimiters as instructions', () => {
			const result = highlightSyntaxNote(['note', 'todo: this is a note', '; @pos 10 20', 'noteEnd'], spriteLookups);

			expect(result[0][0]).toBe('instruction');
			expect(result[1][0]).toBe('comment');
			expect(result[2][0]).toBe('comment');
			expect(result[2][2]).toBe('code');
			expect(result[2][3]).toBe('comment');
			expect(result[3][0]).toBe('instruction');
		});

		it('preserves indentation while coloring note delimiters as instructions', () => {
			const result = highlightSyntaxNote(['  note', '\tindented body', '  noteEnd'], spriteLookups);

			expect(result[0][2]).toBe('instruction');
			expect(result[1][0]).toBe('comment');
			expect(result[2][2]).toBe('instruction');
		});
	});
}
