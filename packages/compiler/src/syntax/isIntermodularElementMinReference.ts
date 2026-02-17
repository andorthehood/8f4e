/**
 * Checks if a string matches the inter-modular element min reference pattern.
 * Valid pattern:
 * - !module.memory (element min reference)
 *
 * Enforces exactly one dot separator (module.memory only).
 * Rejects multi-dot forms (e.g., !module.path.to.memory).
 * Rejects patterns with spaces.
 */
export default function isIntermodularElementMinReference(value: string): boolean {
	// Match !<module>.<memory>
	// Module and memory names cannot contain dots or spaces
	return /^![^\s.]+\.[^\s.]+$/.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularElementMinReference', () => {
		it('matches valid inter-modular element min references', () => {
			expect(isIntermodularElementMinReference('!module.buffer')).toBe(true);
			expect(isIntermodularElementMinReference('!sourceModule.data')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularElementMinReference('!module.path.to.memory')).toBe(false);
			expect(isIntermodularElementMinReference('!mod.a.b')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularElementMinReference('module.id')).toBe(false); // missing !
			expect(isIntermodularElementMinReference('!module')).toBe(false); // missing dot
			expect(isIntermodularElementMinReference('!module.')).toBe(false); // missing memory name
			expect(isIntermodularElementMinReference('module.buffer')).toBe(false); // missing !
			expect(isIntermodularElementMinReference('!module id')).toBe(false); // space
		});

		it('rejects local element min references', () => {
			expect(isIntermodularElementMinReference('!buffer')).toBe(false); // local reference
		});
	});
}
