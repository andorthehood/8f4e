/**
 * Checks if a string uses the element word size function-style syntax: sizeof(name).
 * Does not match the pointee form sizeof(*name).
 */
export default function hasElementWordSizePrefix(name: string): boolean {
	return name.startsWith('sizeof(') && name.endsWith(')') && !name.startsWith('sizeof(*');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementWordSizePrefix', () => {
		it('matches element word size function-style syntax', () => {
			expect(hasElementWordSizePrefix('sizeof(value)')).toBe(true);
		});

		it('returns false for pointee form', () => {
			expect(hasElementWordSizePrefix('sizeof(*value)')).toBe(false);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementWordSizePrefix('value')).toBe(false);
		});
	});
}
