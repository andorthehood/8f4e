/**
 * Checks if a string has a memory reference as suffix (suffix&).
 */
export default function hasMemoryReferencePrefixEnd(name: string): boolean {
	return name.endsWith('&');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasMemoryReferencePrefixEnd', () => {
		it('matches when & is at the end', () => {
			expect(hasMemoryReferencePrefixEnd('value&')).toBe(true);
		});

		it('returns false for prefix-only', () => {
			expect(hasMemoryReferencePrefixEnd('&value')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasMemoryReferencePrefixEnd('value')).toBe(false);
		});
	});
}
