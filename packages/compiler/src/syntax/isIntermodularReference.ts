/**
 * Checks if a string matches the intermodular reference pattern.
 * Valid patterns:
 * - &module.memory (start address reference)
 * - module.memory& (end address reference)
 *
 * Enforces exactly one dot separator (module.memory only).
 * Rejects multi-dot forms (e.g., &module.path.to.memory).
 * Rejects patterns with spaces or double ampersands.
 */
export default function isIntermodularReference(value: string): boolean {
	// Match &<module>.<memory> (start) or <module>.<memory>& (end)
	// Module and memory names cannot contain dots, spaces, or ampersands
	return /^(&[^\s&.]+\.[^\s&.]+|[^\s&.]+\.[^\s&.]+&)$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularReference', () => {
		it('matches valid start-address intermodular references', () => {
			expect(isIntermodularReference('&module.id')).toBe(true);
			expect(isIntermodularReference('&notesMux2.out')).toBe(true);
		});

		it('matches valid end-address intermodular references', () => {
			expect(isIntermodularReference('notesMux2.buffer&')).toBe(true);
			expect(isIntermodularReference('module.memory&')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularReference('&notesMux2.out.notes')).toBe(false);
			expect(isIntermodularReference('&module.path.to.memory')).toBe(false);
			expect(isIntermodularReference('notesMux2.out.notes&')).toBe(false);
			expect(isIntermodularReference('module.path.to.memory&')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularReference('module.id')).toBe(false); // missing & or trailing &
			expect(isIntermodularReference('&module')).toBe(false); // missing dot
			expect(isIntermodularReference('&module.')).toBe(false); // missing memory name
			expect(isIntermodularReference('&notesMux2.')).toBe(false); // missing memory name
			expect(isIntermodularReference('notesMux2.out')).toBe(false); // missing & or trailing &
			expect(isIntermodularReference('&module.id&&')).toBe(false); // double ampersand
			expect(isIntermodularReference('&module id')).toBe(false); // space
			expect(isIntermodularReference('&module.memory&')).toBe(false); // old syntax (both & prefix and & suffix)
		});
	});
}
