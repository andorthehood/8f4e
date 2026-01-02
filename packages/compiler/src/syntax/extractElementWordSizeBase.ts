/**
 * Extracts the base identifier from an element word size identifier by removing the % prefix.
 */
export function extractElementWordSizeBase(name: string): string {
	return name.startsWith('%') ? name.substring(1) : name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementWordSizeBase', () => {
		it('removes element word size prefix', () => {
			expect(extractElementWordSizeBase('%value')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementWordSizeBase('value')).toBe('value');
		});
	});
}
