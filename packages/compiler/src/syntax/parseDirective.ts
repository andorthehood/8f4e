/**
 * Checks if a line is a compiler directive (starts with # after optional whitespace).
 * @param line - The line to check.
 * @returns True if the line is a compiler directive, false otherwise.
 */
export function isDirective(line: string): boolean {
	return /^\s*#/.test(line);
}

/**
 * Parses a compiler directive line.
 * @param line - The line to parse.
 * @returns The directive name if it's a valid directive, null otherwise.
 */
export function parseDirective(line: string): string | null {
	const match = line.match(/^\s*#(\w+)/);
	return match ? match[1] : null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isDirective', () => {
		it('matches lines starting with hash', () => {
			expect(isDirective('#skipExecution')).toBe(true);
			expect(isDirective('   #skipExecution')).toBe(true);
			expect(isDirective('#someDirective')).toBe(true);
		});

		it('returns false for non-directive lines', () => {
			expect(isDirective('; comment')).toBe(false);
			expect(isDirective('add 1 2')).toBe(false);
			expect(isDirective('')).toBe(false);
		});
	});

	describe('parseDirective', () => {
		it('extracts directive name', () => {
			expect(parseDirective('#skipExecution')).toBe('skipExecution');
			expect(parseDirective('   #skipExecution')).toBe('skipExecution');
			expect(parseDirective('#someDirective')).toBe('someDirective');
		});

		it('returns null for non-directive lines', () => {
			expect(parseDirective('; comment')).toBe(null);
			expect(parseDirective('add 1 2')).toBe(null);
			expect(parseDirective('')).toBe(null);
		});
	});
}
