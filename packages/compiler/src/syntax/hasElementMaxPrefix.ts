/**
 * Checks if a string uses the element max function-style syntax: max(name).
 * Does not match the pointee form max(*name).
 */
export default function hasElementMaxPrefix(name: string): boolean {
	return name.startsWith('max(') && name.endsWith(')') && !name.startsWith('max(*');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementMaxPrefix', () => {
		it('matches element max function-style syntax', () => {
			expect(hasElementMaxPrefix('max(value)')).toBe(true);
		});

		it('returns false for pointee form', () => {
			expect(hasElementMaxPrefix('max(*value)')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementMaxPrefix('value')).toBe(false);
		});
	});
}
