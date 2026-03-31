/**
 * Extracts the base identifier from a sizeof() expression.
 * Input:  sizeof(value)
 * Output: value
 */
export default function extractElementWordSizeBase(name: string): string {
	if (name.startsWith('sizeof(') && name.endsWith(')')) {
		return name.slice(7, -1);
	}
	return name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementWordSizeBase', () => {
		it('removes sizeof() wrapper', () => {
			expect(extractElementWordSizeBase('sizeof(value)')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementWordSizeBase('value')).toBe('value');
		});
	});
}
