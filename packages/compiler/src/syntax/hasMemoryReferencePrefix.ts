/**
 * Checks if a string has a memory reference prefix (&prefix) or suffix (suffix&).
 */
export default function hasMemoryReferencePrefix(name: string): boolean {
	return name.startsWith('&') || name.endsWith('&');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasMemoryReferencePrefix', () => {
		it('detects prefix', () => {
			expect(hasMemoryReferencePrefix('&value')).toBe(true);
		});

		it('detects suffix', () => {
			expect(hasMemoryReferencePrefix('value&')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasMemoryReferencePrefix('value')).toBe(false);
		});
	});
}
