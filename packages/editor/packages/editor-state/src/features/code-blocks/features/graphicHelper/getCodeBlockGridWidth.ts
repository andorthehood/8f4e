import { CODE_BLOCK_MIN_GRID_WIDTH } from '../../utils/constants';
import { getTabStopsByLine, getVisualLineWidth } from '../../../code-editing/tabLayout';
import type { CodeBlockDisplayModel } from './buildDisplayModel';

/**
 * Computes the grid width required for a code block.
 * Matches the sizing logic used by graphicHelper effect.
 *
 * @param displayModel - Rendered display model used for visible rows
 * @param code - Code block represented as an array of lines
 * @param minGridWidth - Minimum grid width (defaults to CODE_BLOCK_MIN_GRID_WIDTH)
 * @returns The grid width in grid units
 */
export default function getCodeBlockGridWidth(
	displayModel: CodeBlockDisplayModel,
	code: string[],
	minGridWidth = CODE_BLOCK_MIN_GRID_WIDTH
): number {
	// Calculate line number column width
	const lineNumberColumnWidth = displayModel.lines.length.toString().length;
	const tabStopsByLine = getTabStopsByLine(code);

	// Prepare code with line numbers (matching graphicHelper logic)
	const codeWithLineNumbers = displayModel.lines.map(({ text, rawRow }, displayRow) => {
		const prefix = `${displayRow}`.padStart(lineNumberColumnWidth, '0') + ' ';
		return prefix.length + getVisualLineWidth(text, tabStopsByLine[rawRow] || []);
	});

	// Calculate width: max(minGridWidth, longestLine + 4 padding)
	return Math.max(minGridWidth, Math.max(...codeWithLineNumbers, 0) + 4);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getCodeBlockGridWidth', () => {
		it('returns minGridWidth when code is shorter', () => {
			const code = ['short', 'lines'];
			expect(
				getCodeBlockGridWidth(
					{ lines: code.map((text, rawRow) => ({ text, rawRow })), displayRowToRawRow: [0, 1], rawRowToDisplayRow: [0, 1], isCollapsed: false },
					code,
					50
				)
			).toBe(50);
		});

		it('returns calculated width when code is longer than minGridWidth', () => {
			const code = ['module test', 'this is a much longer line of code', 'moduleEnd'];
			// Line numbers: "0 ", "1 ", "2 " (2 chars each)
			// Longest line with line number: "1 this is a much longer line of code" = 36 chars
			// Width = 36 + 4 = 40
			expect(
				getCodeBlockGridWidth(
					{
						lines: code.map((text, rawRow) => ({ text, rawRow })),
						displayRowToRawRow: [0, 1, 2],
						rawRowToDisplayRow: [0, 1, 2],
						isCollapsed: false,
					},
					code
				)
			).toBe(40);
		});

		it('accounts for multi-digit line numbers', () => {
			// Create 100 lines to ensure line numbers go to 3 digits
			const code = Array(100)
				.fill(0)
				.map((_, i) => 'line ' + i);
			// Line numbers: "000 ", "001 ", ..., "099 " (4 chars each)
			// Sample line: "099 line 99" = 11 chars
			// Width = 11 + 4 = 15
			expect(
				getCodeBlockGridWidth(
					{
						lines: code.map((text, rawRow) => ({ text, rawRow })),
						displayRowToRawRow: code.map((_, rawRow) => rawRow),
						rawRowToDisplayRow: code.map((_, rawRow) => rawRow),
						isCollapsed: false,
					},
					code,
					10
				)
			).toBe(15);
		});

		it('uses default minGridWidth of CODE_BLOCK_MIN_GRID_WIDTH when not specified', () => {
			const code = ['x'];
			// Line number: "0 " (2 chars)
			// Line: "0 x" = 3 chars
			// Width = max(CODE_BLOCK_MIN_GRID_WIDTH, 3 + 4) = max(32, 7) = 32
			expect(
				getCodeBlockGridWidth(
					{ lines: [{ text: 'x', rawRow: 0 }], displayRowToRawRow: [0], rawRowToDisplayRow: [0], isCollapsed: false },
					code
				)
			).toBe(CODE_BLOCK_MIN_GRID_WIDTH);
		});

		it('handles empty code array', () => {
			const code: string[] = [];
			expect(
				getCodeBlockGridWidth({ lines: [], displayRowToRawRow: [], rawRowToDisplayRow: [], isCollapsed: false }, code)
			).toBe(CODE_BLOCK_MIN_GRID_WIDTH);
		});

		it('matches graphicHelper width calculation logic', () => {
			// This test verifies the exact formula used in graphicHelper
			const code = ['module delay', '', 'float[] buffer 44100', 'moduleEnd'];
			// Lines: "0 module delay", "1 ", "2 float[] buffer 44100", "3 moduleEnd"
			// Longest: "2 float[] buffer 44100" = 22 chars
			// Width = max(32, 22 + 4) = max(32, 26) = 32
			expect(
				getCodeBlockGridWidth(
					{
						lines: code.map((text, rawRow) => ({ text, rawRow })),
						displayRowToRawRow: [0, 1, 2, 3],
						rawRowToDisplayRow: [0, 1, 2, 3],
						isCollapsed: false,
					},
					code
				)
			).toBe(CODE_BLOCK_MIN_GRID_WIDTH);

			// Test with longer line
			const longCode = ['module test', 'this is a very long line that exceeds the minimum grid width value'];
			expect(
				getCodeBlockGridWidth(
					{
						lines: longCode.map((text, rawRow) => ({ text, rawRow })),
						displayRowToRawRow: [0, 1],
						rawRowToDisplayRow: [0, 1],
						isCollapsed: false,
					},
					longCode
				)
			).toBe(72); // "0 this is a very long line that exceeds the minimum grid width value" = 68 + 4 = 72
		});

		it('uses tab-expanded visual width instead of raw string length', () => {
			const code = ['; @tab 20 24', '\tb'];
			expect(
				getCodeBlockGridWidth(
					{
						lines: code.map((text, rawRow) => ({ text, rawRow })),
						displayRowToRawRow: [0, 1],
						rawRowToDisplayRow: [0, 1],
						isCollapsed: false,
					},
					code,
					1
				)
			).toBe(27);
		});

		it('uses the most recent tab directive for each line', () => {
			const code = ['; @tab 4 8', '\tb', '; @tab 20 24', '\tb'];
			expect(
				getCodeBlockGridWidth(
					{
						lines: code.map((text, rawRow) => ({ text, rawRow })),
						displayRowToRawRow: [0, 1, 2, 3],
						rawRowToDisplayRow: [0, 1, 2, 3],
						isCollapsed: false,
					},
					code,
					1
				)
			).toBe(27);
		});

		it('uses only visible display rows for collapsed blocks', () => {
			const code = ['module foo', '; @hide', 'this is a very long hidden line', 'moduleEnd'];
			expect(
				getCodeBlockGridWidth(
					{
						lines: [
							{ rawRow: 0, text: 'module foo' },
							{ rawRow: 1, text: '; @hide' },
						],
						displayRowToRawRow: [0, 1],
						rawRowToDisplayRow: [0, 1, undefined, undefined],
						isCollapsed: true,
					},
					code,
					1
				)
			).toBe(16);
		});
	});
}
