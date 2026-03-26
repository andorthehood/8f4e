/**
 * Checks if a string has a pointee element word size prefix (%*).
 */
export default function hasPointeeElementWordSizePrefix(name: string): boolean {
	return name.startsWith('%*');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasPointeeElementWordSizePrefix', () => {
		it('matches pointee element word size prefix', () => {
			expect(hasPointeeElementWordSizePrefix('%*value')).toBe(true);
		});

		it('returns false for plain element word size prefix', () => {
			expect(hasPointeeElementWordSizePrefix('%value')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasPointeeElementWordSizePrefix('value')).toBe(false);
		});
	});
}
