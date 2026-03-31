/**
 * Checks if a string uses the pointee element max function-style syntax: max(*name).
 */
export default function hasPointeeElementMaxPrefix(name: string): boolean {
	return name.startsWith('max(*') && name.endsWith(')');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasPointeeElementMaxPrefix', () => {
		it('matches pointee element max function-style syntax', () => {
			expect(hasPointeeElementMaxPrefix('max(*value)')).toBe(true);
		});

		it('returns false for plain max() form', () => {
			expect(hasPointeeElementMaxPrefix('max(value)')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasPointeeElementMaxPrefix('value')).toBe(false);
		});
	});
}
