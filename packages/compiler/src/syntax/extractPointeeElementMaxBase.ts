/**
 * Extracts the base identifier from a pointee max() expression.
 * Input:  max(*value)
 * Output: value
 */
export default function extractPointeeElementMaxBase(name: string): string {
	if (name.startsWith('max(*') && name.endsWith(')')) {
		return name.slice(5, -1);
	}
	return name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractPointeeElementMaxBase', () => {
		it('removes pointee max() wrapper', () => {
			expect(extractPointeeElementMaxBase('max(*value)')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractPointeeElementMaxBase('value')).toBe('value');
		});

		it('does not strip plain max() form', () => {
			expect(extractPointeeElementMaxBase('max(value)')).toBe('max(value)');
		});
	});
}
