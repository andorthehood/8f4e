/**
 * Extracts the base identifier from an element max identifier by removing the ^ prefix.
 */
export default function extractElementMaxBase(name: string): string {
	return name.startsWith('^') ? name.substring(1) : name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementMaxBase', () => {
		it('removes element max prefix', () => {
			expect(extractElementMaxBase('^value')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementMaxBase('value')).toBe('value');
		});
	});
}
