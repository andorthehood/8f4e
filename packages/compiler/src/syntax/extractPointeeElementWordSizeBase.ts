/**
 * Extracts the base identifier from a pointee sizeof() expression.
 * Input:  sizeof(*value)
 * Output: value
 */
export default function extractPointeeElementWordSizeBase(name: string): string {
	if (name.startsWith('sizeof(*') && name.endsWith(')')) {
		return name.slice(8, -1);
	}
	return name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractPointeeElementWordSizeBase', () => {
		it('removes pointee sizeof() wrapper', () => {
			expect(extractPointeeElementWordSizeBase('sizeof(*value)')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractPointeeElementWordSizeBase('value')).toBe('value');
		});

		it('does not strip plain sizeof() form', () => {
			expect(extractPointeeElementWordSizeBase('sizeof(value)')).toBe('sizeof(value)');
		});
	});
}
