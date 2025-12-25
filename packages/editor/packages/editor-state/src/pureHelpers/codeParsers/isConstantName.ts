/**
 * Determines whether a variable name follows constant naming conventions.
 * A constant name cannot contain lowercase letters - it can only contain
 * uppercase letters, numbers, and special ASCII characters (!, $, _, -, etc.).
 * @param name - The variable name to check.
 * @returns True if the name is a constant name, false otherwise.
 */
export default function isConstantName(name: string): boolean {
	// Check if the name contains any lowercase letters
	return !/[a-z]/.test(name);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isConstantName', () => {
		it('returns true for all uppercase names', () => {
			expect(isConstantName('CONST')).toBe(true);
			expect(isConstantName('MY_CONSTANT')).toBe(true);
			expect(isConstantName('ANOTHER_ONE')).toBe(true);
		});

		it('returns true for uppercase with numbers', () => {
			expect(isConstantName('CONST123')).toBe(true);
			expect(isConstantName('MY_CONSTANT_2')).toBe(true);
			expect(isConstantName('VAR1')).toBe(true);
		});

		it('returns true for uppercase with special characters', () => {
			expect(isConstantName('CONST$VALUE')).toBe(true);
			expect(isConstantName('MY_CONSTANT!')).toBe(true);
			expect(isConstantName('VAR-NAME')).toBe(true);
			expect(isConstantName('$SPECIAL')).toBe(true);
		});

		it('returns false for names with lowercase letters', () => {
			expect(isConstantName('MyVariable')).toBe(false);
			expect(isConstantName('myVariable')).toBe(false);
			expect(isConstantName('CONST_value')).toBe(false);
			expect(isConstantName('camelCase')).toBe(false);
		});

		it('returns false for all lowercase names', () => {
			expect(isConstantName('variable')).toBe(false);
			expect(isConstantName('my_var')).toBe(false);
		});

		it('returns true for empty string', () => {
			// Edge case: empty string has no lowercase letters
			expect(isConstantName('')).toBe(true);
		});

		it('returns true for strings with only numbers', () => {
			expect(isConstantName('123')).toBe(true);
			expect(isConstantName('456')).toBe(true);
		});

		it('returns true for strings with only special characters', () => {
			expect(isConstantName('$$$')).toBe(true);
			expect(isConstantName('___')).toBe(true);
			expect(isConstantName('!!!')).toBe(true);
		});
	});
}
