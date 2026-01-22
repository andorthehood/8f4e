import getLongestLineLength from '../../utils/codeParsers/getLongestLineLength';
import { CODE_BLOCK_MIN_GRID_WIDTH } from '../../utils/constants';

/**
 * Computes the grid width required for a code block.
 * Matches the sizing logic used by graphicHelper effect.
 *
 * @param code - Code block represented as an array of lines
 * @param minGridWidth - Minimum grid width (defaults to CODE_BLOCK_MIN_GRID_WIDTH)
 * @returns The grid width in grid units
 */
export default function getCodeBlockGridWidth(code: string[], minGridWidth = CODE_BLOCK_MIN_GRID_WIDTH): number {
	// Calculate line number column width
	const lineNumberColumnWidth = code.length.toString().length;

	// Prepare code with line numbers (matching graphicHelper logic)
	const codeWithLineNumbers = code.map((line, index) => `${index}`.padStart(lineNumberColumnWidth, '0') + ' ' + line);

	// Calculate width: max(minGridWidth, longestLine + 4 padding)
	return Math.max(minGridWidth, getLongestLineLength(codeWithLineNumbers) + 4);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getCodeBlockGridWidth', () => {
		it('returns minGridWidth when code is shorter', () => {
			const code = ['short', 'lines'];
			expect(getCodeBlockGridWidth(code, 50)).toBe(50);
		});

		it('returns calculated width when code is longer than minGridWidth', () => {
			const code = ['module test', 'this is a much longer line of code', 'moduleEnd'];
			// Line numbers: "0 ", "1 ", "2 " (2 chars each)
			// Longest line with line number: "1 this is a much longer line of code" = 36 chars
			// Width = 36 + 4 = 40
			expect(getCodeBlockGridWidth(code)).toBe(40);
		});

		it('accounts for multi-digit line numbers', () => {
			// Create 100 lines to ensure line numbers go to 3 digits
			const code = Array(100)
				.fill(0)
				.map((_, i) => 'line ' + i);
			// Line numbers: "000 ", "001 ", ..., "099 " (4 chars each)
			// Sample line: "099 line 99" = 11 chars
			// Width = 11 + 4 = 15
			expect(getCodeBlockGridWidth(code, 10)).toBe(15);
		});

		it('uses default minGridWidth of CODE_BLOCK_MIN_GRID_WIDTH when not specified', () => {
			const code = ['x'];
			// Line number: "0 " (2 chars)
			// Line: "0 x" = 3 chars
			// Width = max(CODE_BLOCK_MIN_GRID_WIDTH, 3 + 4) = max(32, 7) = 32
			expect(getCodeBlockGridWidth(code)).toBe(CODE_BLOCK_MIN_GRID_WIDTH);
		});

		it('handles empty code array', () => {
			const code: string[] = [];
			expect(getCodeBlockGridWidth(code)).toBe(CODE_BLOCK_MIN_GRID_WIDTH);
		});

		it('matches graphicHelper width calculation logic', () => {
			// This test verifies the exact formula used in graphicHelper
			const code = ['module delay', '', 'float[] buffer 44100', 'moduleEnd'];
			// Lines: "0 module delay", "1 ", "2 float[] buffer 44100", "3 moduleEnd"
			// Longest: "2 float[] buffer 44100" = 22 chars
			// Width = max(32, 22 + 4) = max(32, 26) = 32
			expect(getCodeBlockGridWidth(code)).toBe(CODE_BLOCK_MIN_GRID_WIDTH);

			// Test with longer line
			const longCode = ['module test', 'this is a very long line that exceeds the minimum grid width value'];
			expect(getCodeBlockGridWidth(longCode)).toBe(72); // "0 this is a very long line that exceeds the minimum grid width value" = 68 + 4 = 72
		});
	});
}
