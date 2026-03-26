/**
 * Checks if a string has a pointee element max prefix (^*).
 */
export default function hasPointeeElementMaxPrefix(name: string): boolean {
	return name.startsWith('^*');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasPointeeElementMaxPrefix', () => {
		it('matches pointee element max prefix', () => {
			expect(hasPointeeElementMaxPrefix('^*value')).toBe(true);
		});

		it('returns false for plain element max prefix', () => {
			expect(hasPointeeElementMaxPrefix('^value')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasPointeeElementMaxPrefix('value')).toBe(false);
		});
	});
}
