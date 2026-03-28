/**
 * Checks if a string uses the pointee element word size function-style syntax: sizeof(*name).
 */
export default function hasPointeeElementWordSizePrefix(name: string): boolean {
	return name.startsWith('sizeof(*') && name.endsWith(')');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasPointeeElementWordSizePrefix', () => {
		it('matches pointee element word size function-style syntax', () => {
			expect(hasPointeeElementWordSizePrefix('sizeof(*value)')).toBe(true);
		});

		it('returns false for plain sizeof() form', () => {
			expect(hasPointeeElementWordSizePrefix('sizeof(value)')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasPointeeElementWordSizePrefix('value')).toBe(false);
		});
	});
}
