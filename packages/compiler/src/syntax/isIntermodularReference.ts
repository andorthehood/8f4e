/**
 * Checks if a string matches the intermodular reference pattern (&module.identifier).
 * Allows dots in module and identifier names to support nested references like &notesMux2.out.notes.
 * Rejects patterns with trailing ampersands or spaces.
 */
export default function isIntermodularReference(value: string): boolean {
	return /^&[^\s&]+\.[^\s&]+$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularReference', () => {
		it('matches valid intermodular references', () => {
			expect(isIntermodularReference('&module.id')).toBe(true);
			expect(isIntermodularReference('&notesMux2.out.notes')).toBe(true);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularReference('module.id')).toBe(false);
			expect(isIntermodularReference('&module')).toBe(false);
			expect(isIntermodularReference('&module.id&')).toBe(false);
			expect(isIntermodularReference('&module id')).toBe(false);
		});
	});
}
