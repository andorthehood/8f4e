/**
 * Checks if a string has an element min prefix (!).
 */
export default function hasElementMinPrefix(name: string): boolean {
	return name.startsWith('!');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementMinPrefix', () => {
		it('matches element min prefix', () => {
			expect(hasElementMinPrefix('!value')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementMinPrefix('value')).toBe(false);
		});
	});
}
