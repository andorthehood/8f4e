/**
 * Extracts the base identifier from a memory reference identifier by removing the & prefix or suffix.
 */
export function extractMemoryReferenceBase(name: string): string {
	if (name.startsWith('&')) {
		return name.substring(1);
	}
	if (name.endsWith('&')) {
		return name.slice(0, -1);
	}
	return name;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('extractMemoryReferenceBase', () => {
		it('removes prefix', () => {
			expect(extractMemoryReferenceBase('&value')).toBe('value');
		});

		it('removes suffix', () => {
			expect(extractMemoryReferenceBase('value&')).toBe('value');
		});

		it('leaves plain identifiers unchanged', () => {
			expect(extractMemoryReferenceBase('value')).toBe('value');
		});
	});
}
