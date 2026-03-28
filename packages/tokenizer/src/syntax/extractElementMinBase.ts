/**
 * Extracts the base identifier from a min() expression.
 * Input:  min(value)
 * Output: value
 */
export default function extractElementMinBase(name: string): string {
	if (name.startsWith('min(') && name.endsWith(')')) {
		return name.slice(4, -1);
	}
	return name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementMinBase', () => {
		it('removes min() wrapper', () => {
			expect(extractElementMinBase('min(value)')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementMinBase('value')).toBe('value');
		});
	});
}
