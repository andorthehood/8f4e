/**
 * Checks if a string uses the element count function-style syntax: count(name).
 */
export default function hasElementCountPrefix(name: string): boolean {
	return name.startsWith('count(') && name.endsWith(')');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementCountPrefix', () => {
		it('matches element count function-style syntax', () => {
			expect(hasElementCountPrefix('count(value)')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementCountPrefix('value')).toBe(false);
		});
	});
}
