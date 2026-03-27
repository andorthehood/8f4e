/**
 * Checks if a string matches the inter-modular element count reference pattern.
 * Valid pattern:
 * - count(module:memory) (element count reference)
 *
 * Enforces exactly one colon separator inside the parentheses.
 * Rejects extra separators/forms (e.g., count(module:path:to:memory)).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementCountReference(value: string): boolean {
	// Match count(<module>:<memory>)
	// Module and memory names cannot contain spaces, colons, or parentheses
	return /^count\([^\s:()]+:[^\s:()]+\)$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementCountReference', () => {
		it('matches valid inter-modular element count references', () => {
			expect(isIntermodularElementCountReference('count(module:buffer)')).toBe(true);
			expect(isIntermodularElementCountReference('count(sourceModule:data)')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementCountReference('count(module:path:to:memory)')).toBe(false);
			expect(isIntermodularElementCountReference('count(mod:a:b)')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementCountReference('module.id')).toBe(false); // missing count()
			expect(isIntermodularElementCountReference('count(module)')).toBe(false); // missing colon
			expect(isIntermodularElementCountReference('count(module:)')).toBe(false); // missing memory name
			expect(isIntermodularElementCountReference('count(module id)')).toBe(false); // space
		});

		it('rejects local element count references', () => {
			expect(isIntermodularElementCountReference('count(buffer)')).toBe(false); // local reference
		});
	});
}
