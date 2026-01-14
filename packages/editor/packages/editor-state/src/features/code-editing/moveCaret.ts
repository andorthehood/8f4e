import type { Direction } from '../code-blocks/finders/findClosestCodeBlockInDirection';

export type MoveDirection = Direction | 'jump';

/**
 * Calculates a new caret position after moving in the requested direction while clamping to document bounds.
 * @param code Document contents as an array of lines.
 * @param row Current caret row index.
 * @param col Current caret column index.
 * @param direction Movement direction requested by the user.
 * @returns Tuple containing the resulting row and column.
 */
export function moveCaret(code: string[], row: number, col: number, direction: MoveDirection): [number, number] {
	switch (direction) {
		case 'up': {
			const nextRow = Math.max(row - 1, 0);
			const nextCol = code[nextRow][col] ? col : code[nextRow].length;
			return [nextRow, nextCol];
		}
		case 'down': {
			const nextRow = Math.min(row + 1, code.length - 1);
			const nextCol = code[nextRow][col] ? col : code[nextRow].length;
			return [nextRow, nextCol];
		}
		case 'left': {
			const nextCol = Math.max(col - 1, 0);
			return [row, nextCol];
		}
		case 'right': {
			const nextCol = Math.min(col + 1, code[row].length);
			return [row, nextCol];
		}
		case 'jump': {
			const boundedRow = Math.min(Math.max(row, 0), code.length - 1);
			const boundedCol = Math.max(Math.min(col, code[boundedRow].length), 0);
			return [boundedRow, boundedCol];
		}
	}
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('moveCaret', () => {
		const code = ['abc', 'd', 'ef'];

		it('moves up and clamps column to the new line length', () => {
			expect(moveCaret(code, 1, 2, 'up')).toEqual([0, 2]);
			expect(moveCaret(code, 2, 2, 'up')).toEqual([1, 1]);
		});

		it('moves down and clamps column to the new line length', () => {
			expect(moveCaret(code, 0, 2, 'down')).toEqual([1, 1]);
			expect(moveCaret(code, 1, 0, 'down')).toEqual([2, 0]);
		});

		it('moves horizontally within the same line', () => {
			expect(moveCaret(code, 0, 0, 'left')).toEqual([0, 0]);
			expect(moveCaret(code, 0, 0, 'right')).toEqual([0, 1]);
			expect(moveCaret(code, 0, 3, 'right')).toEqual([0, 3]);
		});

		it('jumps to bounded coordinates', () => {
			expect(moveCaret(code, 5, 10, 'jump')).toEqual([2, 2]);
			expect(moveCaret(code, 1, -2, 'jump')).toEqual([1, 0]);
		});
	});
}
