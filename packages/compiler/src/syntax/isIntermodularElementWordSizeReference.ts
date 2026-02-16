/**
 * Checks if a string matches the inter-modular element word size reference pattern.
 * Valid pattern:
 * - %module.memory (element word size reference)
 *
 * Enforces exactly one dot separator (module.memory only).
 * Rejects multi-dot forms (e.g., %module.path.to.memory).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementWordSizeReference(value: string): boolean {
	// Match %<module>.<memory>
	// Module and memory names cannot contain dots or spaces
	return /^%[^\s.]+\.[^\s.]+$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementWordSizeReference', () => {
		it('matches valid inter-modular element word size references', () => {
			expect(isIntermodularElementWordSizeReference('%module.buffer')).toBe(true);
			expect(isIntermodularElementWordSizeReference('%sourceModule.data')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementWordSizeReference('%module.path.to.memory')).toBe(false);
			expect(isIntermodularElementWordSizeReference('%mod.a.b')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementWordSizeReference('module.id')).toBe(false); // missing %
			expect(isIntermodularElementWordSizeReference('%module')).toBe(false); // missing dot
			expect(isIntermodularElementWordSizeReference('%module.')).toBe(false); // missing memory name
			expect(isIntermodularElementWordSizeReference('module.buffer')).toBe(false); // missing %
			expect(isIntermodularElementWordSizeReference('%module id')).toBe(false); // space
		});

		it('rejects local element word size references', () => {
			expect(isIntermodularElementWordSizeReference('%buffer')).toBe(false); // local reference
		});
	});
}
