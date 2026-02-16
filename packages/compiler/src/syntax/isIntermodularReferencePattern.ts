/**
 * Tests if a string matches the intermodular reference pattern.
 * This regex is used for detecting inter-module references in AST arguments
 * during compilation and dependency sorting.
 *
 * Valid patterns:
 * - &module.memory (start address reference)
 * - module.memory& (end address reference)
 *
 * Enforces exactly one dot separator (module.memory only).
 */
export const INTERMODULAR_REFERENCE_PATTERN = /^(&[^\s&.]+\.[^\s&.]+|[^\s&.]+\.[^\s&.]+&)$/;

/**
 * Tests if a string matches the intermodular reference pattern.
 */
export default function isIntermodularReferencePattern(value: string): boolean {
	return INTERMODULAR_REFERENCE_PATTERN.test(value);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isIntermodularReferencePattern', () => {
		it('matches valid start-address intermodular references', () => {
			expect(isIntermodularReferencePattern('&module.id')).toBe(true);
			expect(isIntermodularReferencePattern('&notesMux2.out')).toBe(true);
		});

		it('matches valid end-address intermodular references', () => {
			expect(isIntermodularReferencePattern('notesMux2.buffer&')).toBe(true);
			expect(isIntermodularReferencePattern('module.memory&')).toBe(true);
		});

		it('rejects multi-dot references', () => {
			expect(isIntermodularReferencePattern('&notesMux2.out.notes')).toBe(false);
			expect(isIntermodularReferencePattern('&module.path.to.memory')).toBe(false);
			expect(isIntermodularReferencePattern('notesMux2.out.notes&')).toBe(false);
			expect(isIntermodularReferencePattern('module.path.to.memory&')).toBe(false);
		});

		it('rejects invalid references', () => {
			expect(isIntermodularReferencePattern('module.id')).toBe(false); // missing & or trailing &
			expect(isIntermodularReferencePattern('&module')).toBe(false); // missing dot
			expect(isIntermodularReferencePattern('&module.')).toBe(false); // missing memory name
			expect(isIntermodularReferencePattern('&notesMux2.')).toBe(false); // missing memory name
			expect(isIntermodularReferencePattern('notesMux2.out')).toBe(false); // missing & or trailing &
			expect(isIntermodularReferencePattern('&module.id&&')).toBe(false); // double ampersand
			expect(isIntermodularReferencePattern('&module id')).toBe(false); // space
			expect(isIntermodularReferencePattern('&module.memory&')).toBe(false); // old syntax (both & prefix and & suffix)
		});
	});
}
