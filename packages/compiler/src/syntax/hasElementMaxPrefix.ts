/**
 * Checks if a string has an element max prefix (^).
 */
export default function hasElementMaxPrefix(name: string): boolean {
	return name.startsWith('^');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementMaxPrefix', () => {
		it('matches element max prefix', () => {
			expect(hasElementMaxPrefix('^value')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementMaxPrefix('value')).toBe(false);
		});
	});
}
