/**
 * Checks if a path segment is an array index (e.g., "[0]", "[3]")
 */
export default function isArrayIndex(segment: string): boolean {
	return /^\[\d+\]$/.test(segment);
}

/**
 * Checks if a path segment is an array append slot (e.g., "[]")
 */
export function isArrayAppendSlot(segment: string): boolean {
	return segment === '[]';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('isArrayIndex', () => {
		it('should return true for [0]', () => {
			expect(isArrayIndex('[0]')).toBe(true);
		});

		it('should return true for [123]', () => {
			expect(isArrayIndex('[123]')).toBe(true);
		});

		it('should return false for regular string', () => {
			expect(isArrayIndex('foo')).toBe(false);
		});

		it('should return false for incomplete bracket', () => {
			expect(isArrayIndex('[0')).toBe(false);
		});

		it('should return false for non-numeric index', () => {
			expect(isArrayIndex('[abc]')).toBe(false);
		});

		it('should return false for negative number', () => {
			expect(isArrayIndex('[-1]')).toBe(false);
		});

		it('should return false for empty brackets', () => {
			expect(isArrayIndex('[]')).toBe(false);
		});
	});

	describe('isArrayAppendSlot', () => {
		it('should return true for []', () => {
			expect(isArrayAppendSlot('[]')).toBe(true);
		});

		it('should return false for [0]', () => {
			expect(isArrayAppendSlot('[0]')).toBe(false);
		});

		it('should return false for regular string', () => {
			expect(isArrayAppendSlot('foo')).toBe(false);
		});

		it('should return false for incomplete bracket', () => {
			expect(isArrayAppendSlot('[')).toBe(false);
		});
	});
}
