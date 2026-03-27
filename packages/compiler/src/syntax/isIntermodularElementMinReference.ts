/**
 * Checks if a string matches the inter-modular element min reference pattern.
 * Valid pattern:
 * - min(module.memory) (element min reference)
 *
 * Enforces exactly one dot separator inside the parentheses.
 * Rejects multi-dot forms (e.g., min(module.path.to.memory)).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementMinReference(value: string): boolean {
	// Match min(<module>.<memory>)
	// Module and memory names cannot contain dots, spaces, or parentheses
	return /^min\([^\s.()]+\.[^\s.()]+\)$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementMinReference', () => {
		it('matches valid inter-modular element min references', () => {
			expect(isIntermodularElementMinReference('min(module.buffer)')).toBe(true);
			expect(isIntermodularElementMinReference('min(sourceModule.data)')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementMinReference('min(module.path.to.memory)')).toBe(false);
			expect(isIntermodularElementMinReference('min(mod.a.b)')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementMinReference('module.id')).toBe(false); // missing min()
			expect(isIntermodularElementMinReference('min(module)')).toBe(false); // missing dot
			expect(isIntermodularElementMinReference('min(module.)')).toBe(false); // missing memory name
			expect(isIntermodularElementMinReference('min(module id)')).toBe(false); // space
		});

		it('rejects local element min references', () => {
			expect(isIntermodularElementMinReference('min(buffer)')).toBe(false); // local reference
		});
	});
}
