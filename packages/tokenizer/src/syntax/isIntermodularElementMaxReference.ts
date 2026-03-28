/**
 * Checks if a string matches the inter-modular element max reference pattern.
 * Valid pattern:
 * - max(module:memory) (element max reference)
 *
 * Enforces exactly one colon separator inside the parentheses.
 * Rejects extra separators/forms (e.g., max(module:path:to:memory)).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementMaxReference(value: string): boolean {
	// Match max(<module>:<memory>)
	// Module and memory names cannot contain spaces, colons, or parentheses
	return /^max\([^\s:()]+:[^\s:()]+\)$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementMaxReference', () => {
		it('matches valid inter-modular element max references', () => {
			expect(isIntermodularElementMaxReference('max(module:buffer)')).toBe(true);
			expect(isIntermodularElementMaxReference('max(sourceModule:data)')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementMaxReference('max(module:path:to:memory)')).toBe(false);
			expect(isIntermodularElementMaxReference('max(mod:a:b)')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementMaxReference('module.id')).toBe(false); // missing max()
			expect(isIntermodularElementMaxReference('max(module)')).toBe(false); // missing colon
			expect(isIntermodularElementMaxReference('max(module:)')).toBe(false); // missing memory name
			expect(isIntermodularElementMaxReference('max(module id)')).toBe(false); // space
		});

		it('rejects local element max references', () => {
			expect(isIntermodularElementMaxReference('max(buffer)')).toBe(false); // local reference
		});
	});
}
