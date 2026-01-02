/**
 * Extracts the base identifier from an element count identifier by removing the $ prefix.
 */
export default function extractElementCountBase(name: string): string {
	return name.startsWith('$') ? name.substring(1) : name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementCountBase', () => {
		it('removes element count prefix', () => {
			expect(extractElementCountBase('$value')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementCountBase('value')).toBe('value');
		});
	});
}
