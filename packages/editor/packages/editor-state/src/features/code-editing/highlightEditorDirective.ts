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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('highlightEditorDirective', () => {
		it('switches only editor directive @ markers back to code color', () => {
			const line = '; @pos 10 20';
			const codeColors = new Array(line.length).fill(undefined);
			codeColors[0] = 'comment';

			highlightEditorDirective(line, codeColors, 'code', 'comment');

			expect(codeColors[0]).toBe('comment');
			expect(codeColors[2]).toBe('code');
			expect(codeColors[3]).toBe('comment');
		});

		it('supports trailing editor directives', () => {
			const line = 'push 1 ; @watch counter';
			const codeColors = new Array(line.length).fill(undefined);
			codeColors[7] = 'comment';

			highlightEditorDirective(line, codeColors, 'code', 'comment');

			expect(codeColors[7]).toBe('comment');
			expect(codeColors[9]).toBe('code');
			expect(codeColors[10]).toBe('comment');
		});

		it('switches every chained editor directive @ marker back to code color', () => {
			const line = '; @stop 1 01 @favorite @home';
			const codeColors = new Array(line.length).fill(undefined);
			codeColors[0] = 'comment';

			highlightEditorDirective(line, codeColors, 'code', 'comment');

			expect(codeColors[2]).toBe('code');
			expect(codeColors[3]).toBe('comment');
			expect(codeColors[13]).toBe('code');
			expect(codeColors[14]).toBe('comment');
			expect(codeColors[23]).toBe('code');
			expect(codeColors[24]).toBe('comment');
		});
	});
}
