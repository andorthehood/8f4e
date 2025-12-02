/**
 * Computes the maximum string length across all provided lines.
 * @param code - Code block represented as an array of lines.
 * @returns The length of the longest line, or 0 when the block is empty.
 */
export default function getLongestLineLength(code: string[]) {
	return code.reduce((longestLength, line) => (line.length > longestLength ? line.length : longestLength), 0);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getLongestLineLength', () => {
		it('returns the length of the longest entry', () => {
			expect(getLongestLineLength(['short', 'much longer line', 'medium'])).toBe(16);
		});

		it('returns zero for empty input', () => {
			expect(getLongestLineLength([])).toBe(0);
		});
	});
}
