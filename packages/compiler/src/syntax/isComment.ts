/**
 * Checks if a line is a comment (starts with semicolon after optional whitespace).
 * @param line - The line to check.
 * @returns True if the line is a comment, false otherwise.
 */
export function isComment(line: string): boolean {
	return /^\s*;/.test(line);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isComment', () => {
		it('matches lines starting with semicolon', () => {
			expect(isComment('; comment')).toBe(true);
			expect(isComment('   ; comment')).toBe(true);
		});

		it('returns false for non-comment lines', () => {
			expect(isComment('add 1 2')).toBe(false);
		});
	});
}
