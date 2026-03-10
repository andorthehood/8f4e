/**
 * Checks if a string matches the intermodular module-base reference pattern.
 * Valid pattern:
 * - &module: (start address of a module)
 * - module:& (end address of a module)
 *
 * Rejects local memory references like &buffer and intermodular memory references like &module:memory.
 */
export default function isIntermodularModuleReference(value: string): boolean {
	return /^(&[^\s&:.]+:|[^\s&:.]+:&)$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularModuleReference', () => {
		it('matches valid intermodular module-base references', () => {
			expect(isIntermodularModuleReference('&module:')).toBe(true);
			expect(isIntermodularModuleReference('&notesMux2:')).toBe(true);
			expect(isIntermodularModuleReference('module:&')).toBe(true);
			expect(isIntermodularModuleReference('notesMux2:&')).toBe(true);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularModuleReference('&buffer')).toBe(false);
			expect(isIntermodularModuleReference('&module:memory')).toBe(false);
			expect(isIntermodularModuleReference('module:')).toBe(false);
			expect(isIntermodularModuleReference('&module:&')).toBe(false);
			expect(isIntermodularModuleReference('&module::')).toBe(false);
			expect(isIntermodularModuleReference('&module.memory')).toBe(false);
		});
	});
}
