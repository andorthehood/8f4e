/**
 * Determines whether a variable name follows constant naming conventions.
 * A constant name must start with an uppercase ASCII letter (A-Z) and cannot
 * contain lowercase letters - it can only contain uppercase letters, numbers,
 * and special ASCII characters (!, $, _, -, etc.).
 * @param name - The variable name to check.
 * @returns True if the name is a constant name, false otherwise.
 */
export function isConstantName(name: string): boolean {
	// Must start with uppercase letter and contain no lowercase letters
	return /^[A-Z]/.test(name) && !/[a-z]/.test(name);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isConstantName', () => {
		it('accepts uppercase identifiers', () => {
			expect(isConstantName('FOO')).toBe(true);
			expect(isConstantName('A1_B-2')).toBe(true);
		});

		it('rejects lowercase starts', () => {
			expect(isConstantName('foo')).toBe(false);
		});

		it('rejects mixed case', () => {
			expect(isConstantName('Foo')).toBe(false);
		});
	});
}
