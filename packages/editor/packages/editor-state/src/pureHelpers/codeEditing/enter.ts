import { moveCaret } from './moveCaret';

/**
 * Splits the current line at the caret and moves the caret to the start of the next line.
 * @param code Document contents split by line.
 * @param row Caret row index.
 * @param col Caret column index.
 * @returns Updated document and caret location after inserting a newline.
 */
export default function enter(
	code: string[],
	row: number,
	col: number
): {
	code: string[];
	row: number;
	col: number;
} {
	const newCode = [...code];
	const save = newCode[row].substring(col);
	newCode[row] = newCode[row].substring(0, col);
	newCode.splice(row + 1, 0, '');
	newCode[row + 1] = save;

	const [newRow] = moveCaret(newCode, row, col, 'ArrowDown');
	return { code: newCode, row: newRow, col: 0 };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('enter', () => {
		it('splits the current line at the caret', () => {
			const { code } = enter(['abcd'], 0, 2);
			expect(code).toEqual(['ab', 'cd']);
		});

		it('moves the caret to the start of the next line', () => {
			const { row, col } = enter(['ab'], 0, 2);
			expect(row).toBe(1);
			expect(col).toBe(0);
		});
	});
}
