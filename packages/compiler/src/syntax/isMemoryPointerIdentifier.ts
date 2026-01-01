/**
 * Checks if a string has a memory pointer prefix (*).
 */
export function isMemoryPointerIdentifier(name: string): boolean {
	return name.startsWith('*');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isMemoryPointerIdentifier', () => {
		it('matches pointer identifiers', () => {
			expect(isMemoryPointerIdentifier('*value')).toBe(true);
		});

		it('returns false for non-pointers', () => {
			expect(isMemoryPointerIdentifier('value')).toBe(false);
		});
	});
}
