/**
 * Extracts the base identifier from an element min identifier by removing the ! prefix.
 */
export default function extractElementMinBase(name: string): string {
	return name.startsWith('!') ? name.substring(1) : name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractElementMinBase', () => {
		it('removes element min prefix', () => {
			expect(extractElementMinBase('!value')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractElementMinBase('value')).toBe('value');
		});
	});
}
