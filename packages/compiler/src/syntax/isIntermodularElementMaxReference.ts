/**
 * Checks if a string matches the inter-modular element max reference pattern.
 * Valid pattern:
 * - ^module.memory (element max reference)
 *
 * Enforces exactly one dot separator (module.memory only).
 * Rejects multi-dot forms (e.g., ^module.path.to.memory).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementMaxReference(value: string): boolean {
	// Match ^<module>.<memory>
	// Module and memory names cannot contain dots or spaces
	return /^\^[^\s.]+\.[^\s.]+$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementMaxReference', () => {
		it('matches valid inter-modular element max references', () => {
			expect(isIntermodularElementMaxReference('^module.buffer')).toBe(true);
			expect(isIntermodularElementMaxReference('^sourceModule.data')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementMaxReference('^module.path.to.memory')).toBe(false);
			expect(isIntermodularElementMaxReference('^mod.a.b')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementMaxReference('module.id')).toBe(false); // missing ^
			expect(isIntermodularElementMaxReference('^module')).toBe(false); // missing dot
			expect(isIntermodularElementMaxReference('^module.')).toBe(false); // missing memory name
			expect(isIntermodularElementMaxReference('module.buffer')).toBe(false); // missing ^
			expect(isIntermodularElementMaxReference('^module id')).toBe(false); // space
		});

		it('rejects local element max references', () => {
			expect(isIntermodularElementMaxReference('^buffer')).toBe(false); // local reference
		});
	});
}
