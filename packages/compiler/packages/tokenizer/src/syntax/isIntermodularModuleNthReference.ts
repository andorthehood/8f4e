/**
 * Checks if a string matches the intermodular module nth-item reference pattern.
 * Valid patterns:
 * - &module:0 (address of the 0th memory item in a module)
 * - &module:1 (address of the 1st memory item in a module)
 * etc.
 *
 * Rejects named memory references like &module:buffer and module-base references like &module:.
 */
export default function isIntermodularModuleNthReference(value: string): boolean {
	return /^&[^\s&:.]+:[0-9]+$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularModuleNthReference', () => {
		it('matches valid nth-item references', () => {
			expect(isIntermodularModuleNthReference('&module:0')).toBe(true);
			expect(isIntermodularModuleNthReference('&module:1')).toBe(true);
			expect(isIntermodularModuleNthReference('&notesMux2:3')).toBe(true);
			expect(isIntermodularModuleNthReference('&mod:10')).toBe(true);
		});

		it('rejects non-nth references', () => {
			expect(isIntermodularModuleNthReference('&module:')).toBe(false); // module-base reference
			expect(isIntermodularModuleNthReference('&module:buffer')).toBe(false); // named memory reference
			expect(isIntermodularModuleNthReference('module:0')).toBe(false); // missing & prefix
			expect(isIntermodularModuleNthReference('&module:0&')).toBe(false); // trailing &
			expect(isIntermodularModuleNthReference('&module:-1')).toBe(false); // negative index
			expect(isIntermodularModuleNthReference('&module:1.5')).toBe(false); // float index
		});
	});
}
