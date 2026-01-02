import { moveCaret } from './moveCaret';

/**
 * Inserts a character at the caret position and advances the caret by one column.
 * @param code Current program text split by line.
 * @param row Caret row index.
 * @param col Caret column index.
 * @param char Character to insert.
 * @returns Updated code buffer plus the new caret coordinates.
 */
export default function type(
	code: string[],
	row: number,
	col: number,
	char: string
): { code: string[]; row: number; col: number } {
	const newCode = [...code];
	newCode[row] = newCode[row].substring(0, col) + char + newCode[row].substring(col);
	const [newRow, newCol] = moveCaret(newCode, row, col, 'ArrowRight');
	return {
		code: newCode,
		row: newRow,
		col: newCol,
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('type', () => {
		it('inserts the character at the caret', () => {
			const { code } = type(['ac'], 0, 1, 'b');
			expect(code).toEqual(['abc']);
		});

		it('moves the caret one character to the right', () => {
			const { row, col } = type(['ab'], 0, 1, 'c');
			expect(row).toBe(0);
			expect(col).toBe(2);
		});
	});
}
