/**
 * Extracts the numeric index from an array index segment (e.g., "[0]" -> 0)
 */
export function getArrayIndex(segment: string): number {
	return parseInt(segment.slice(1, -1), 10);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getArrayIndex', () => {
		it('should extract 0 from [0]', () => {
			expect(getArrayIndex('[0]')).toBe(0);
		});

		it('should extract 42 from [42]', () => {
			expect(getArrayIndex('[42]')).toBe(42);
		});

		it('should extract 123 from [123]', () => {
			expect(getArrayIndex('[123]')).toBe(123);
		});
	});
}
