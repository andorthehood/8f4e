/**
 * Checks if a string uses the element min function-style syntax: min(name).
 */
export default function hasElementMinPrefix(name: string): boolean {
	return name.startsWith('min(') && name.endsWith(')');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('hasElementMinPrefix', () => {
		it('matches element min function-style syntax', () => {
			expect(hasElementMinPrefix('min(value)')).toBe(true);
		});

		it('returns false for plain identifiers', () => {
			expect(hasElementMinPrefix('value')).toBe(false);
		});
	});
}
