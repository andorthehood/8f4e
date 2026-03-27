/**
 * Checks if a string matches the inter-modular element word size reference pattern.
 * Valid pattern:
 * - sizeof(module:memory) (element word size reference)
 *
 * Enforces exactly one colon separator inside the parentheses.
 * Rejects extra separators/forms (e.g., sizeof(module:path:to:memory)).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementWordSizeReference(value: string): boolean {
	// Match sizeof(<module>:<memory>)
	// Module and memory names cannot contain spaces, colons, or parentheses
	return /^sizeof\([^\s:()]+:[^\s:()]+\)$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementWordSizeReference', () => {
		it('matches valid inter-modular element word size references', () => {
			expect(isIntermodularElementWordSizeReference('sizeof(module:buffer)')).toBe(true);
			expect(isIntermodularElementWordSizeReference('sizeof(sourceModule:data)')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementWordSizeReference('sizeof(module:path:to:memory)')).toBe(false);
			expect(isIntermodularElementWordSizeReference('sizeof(mod:a:b)')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementWordSizeReference('module.id')).toBe(false); // missing sizeof()
			expect(isIntermodularElementWordSizeReference('sizeof(module)')).toBe(false); // missing colon
			expect(isIntermodularElementWordSizeReference('sizeof(module:)')).toBe(false); // missing memory name
			expect(isIntermodularElementWordSizeReference('sizeof(module id)')).toBe(false); // space
		});

		it('rejects local element word size references', () => {
			expect(isIntermodularElementWordSizeReference('sizeof(buffer)')).toBe(false); // local reference
		});
	});
}
