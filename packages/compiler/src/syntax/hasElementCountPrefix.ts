/**
 * Checks if a string has an element count prefix ($).
 */
export function hasElementCountPrefix(name: string): boolean {
	return name.startsWith('$');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementCountPrefix', () => {
		it('matches element count prefix', () => {
			expect(hasElementCountPrefix('$value')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementCountPrefix('value')).toBe(false);
		});
	});
}
