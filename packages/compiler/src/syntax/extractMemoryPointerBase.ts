/**
 * Extracts the base identifier from a memory pointer identifier by removing the * prefix.
 */
export function extractMemoryPointerBase(name: string): string {
	return name.startsWith('*') ? name.substring(1) : name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractMemoryPointerBase', () => {
		it('removes pointer prefix', () => {
			expect(extractMemoryPointerBase('*value')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractMemoryPointerBase('value')).toBe('value');
		});
	});
}
