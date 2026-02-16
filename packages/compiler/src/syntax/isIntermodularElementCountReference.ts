/**
 * Checks if a string matches the inter-modular element count reference pattern.
 * Valid pattern:
 * - $module.memory (element count reference)
 *
 * Enforces exactly one dot separator (module.memory only).
 * Rejects multi-dot forms (e.g., $module.path.to.memory).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementCountReference(value: string): boolean {
	// Match $<module>.<memory>
	// Module and memory names cannot contain dots or spaces
	return /^\$[^\s.]+\.[^\s.]+$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementCountReference', () => {
		it('matches valid inter-modular element count references', () => {
			expect(isIntermodularElementCountReference('$module.buffer')).toBe(true);
			expect(isIntermodularElementCountReference('$sourceModule.data')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementCountReference('$module.path.to.memory')).toBe(false);
			expect(isIntermodularElementCountReference('$mod.a.b')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementCountReference('module.id')).toBe(false); // missing $
			expect(isIntermodularElementCountReference('$module')).toBe(false); // missing dot
			expect(isIntermodularElementCountReference('$module.')).toBe(false); // missing memory name
			expect(isIntermodularElementCountReference('module.buffer')).toBe(false); // missing $
			expect(isIntermodularElementCountReference('$module id')).toBe(false); // space
		});

		it('rejects local element count references', () => {
			expect(isIntermodularElementCountReference('$buffer')).toBe(false); // local reference
		});
	});
}
