/**
 * Extracts the base identifier from a pointee element word size identifier by removing the %* prefix.
 */
export default function extractPointeeElementWordSizeBase(name: string): string {
	return name.startsWith('%*') ? name.substring(2) : name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractPointeeElementWordSizeBase', () => {
		it('removes pointee element word size prefix', () => {
			expect(extractPointeeElementWordSizeBase('%*value')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractPointeeElementWordSizeBase('value')).toBe('value');
		});

		it('does not strip plain % prefix', () => {
			expect(extractPointeeElementWordSizeBase('%value')).toBe('%value');
		});
	});
}
