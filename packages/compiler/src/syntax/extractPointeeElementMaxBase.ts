/**
 * Extracts the base identifier from a pointee element max identifier by removing the ^* prefix.
 */
export default function extractPointeeElementMaxBase(name: string): string {
	return name.startsWith('^*') ? name.substring(2) : name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractPointeeElementMaxBase', () => {
		it('removes pointee element max prefix', () => {
			expect(extractPointeeElementMaxBase('^*value')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractPointeeElementMaxBase('value')).toBe('value');
		});

		it('does not strip plain ^ prefix', () => {
			expect(extractPointeeElementMaxBase('^value')).toBe('^value');
		});
	});
}
