/**
 * Checks if a string has a memory reference as prefix (&prefix).
 */
export function hasMemoryReferencePrefixStart(name: string): boolean {
	return name.startsWith('&');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasMemoryReferencePrefixStart', () => {
		it('matches when & is at the start', () => {
			expect(hasMemoryReferencePrefixStart('&value')).toBe(true);
		});

		it('returns false for suffix-only', () => {
			expect(hasMemoryReferencePrefixStart('value&')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasMemoryReferencePrefixStart('value')).toBe(false);
		});
	});
}
