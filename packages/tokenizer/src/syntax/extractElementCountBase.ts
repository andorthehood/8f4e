/**
 * Extracts the base identifier from a count() expression.
 * Input:  count(value)
 * Output: value
 */
export default function extractElementCountBase(name: string): string {
	if (name.startsWith('count(') && name.endsWith(')')) {
		return name.slice(6, -1);
	}
	return name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementCountBase', () => {
		it('removes count() wrapper', () => {
			expect(extractElementCountBase('count(value)')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementCountBase('value')).toBe('value');
		});
	});
}
