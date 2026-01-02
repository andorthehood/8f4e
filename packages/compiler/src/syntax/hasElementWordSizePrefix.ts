/**
 * Checks if a string has an element word size prefix (%).
 */
export function hasElementWordSizePrefix(name: string): boolean {
	return name.startsWith('%');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementWordSizePrefix', () => {
		it('matches element word size prefix', () => {
			expect(hasElementWordSizePrefix('%value')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementWordSizePrefix('value')).toBe(false);
		});
	});
}
