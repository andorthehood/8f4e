/**
 * Extracts the base identifier from a max() expression.
 * Input:  max(value)
 * Output: value
 */
export default function extractElementMaxBase(name: string): string {
	if (name.startsWith('max(') && name.endsWith(')')) {
		return name.slice(4, -1);
	}
	return name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementMaxBase', () => {
		it('removes max() wrapper', () => {
			expect(extractElementMaxBase('max(value)')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementMaxBase('value')).toBe('value');
		});
	});
}
