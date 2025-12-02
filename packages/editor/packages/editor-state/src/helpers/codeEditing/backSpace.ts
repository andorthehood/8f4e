import { moveCaret } from './moveCaret';

export function backSpace(code: string[], row: number, col: number): { code: string[]; row: number; col: number } {
	const newCode = [...code];

	if (col > 0) {
		const [newRow, newCol] = moveCaret(code, row, col, 'ArrowLeft');
		newCode[row] = newCode[row].slice(0, newCol) + newCode[row].slice(newCol + 1);
		return { code: newCode, row: newRow, col: newCol };
	}

	if (row > 0) {
		const save = newCode[row];
		const [newRow] = moveCaret(newCode, row, col, 'ArrowUp');
		newCode.splice(row, 1);
		newCode[newRow] = newCode[newRow] + save;
		return { code: newCode, row: newRow, col: newCode[newRow].length };
	}

	return { code, row, col };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('backSpace', () => {
		it('removes a character when the caret is not at the start of the line', () => {
			const { code, row, col } = backSpace(['abc'], 0, 2);
			expect(code).toEqual(['ac']);
			expect(row).toBe(0);
			expect(col).toBe(1);
		});

		it('merges with the previous line when deleting at column 0', () => {
			const { code, row, col } = backSpace(['ab', 'cd'], 1, 0);
			expect(code).toEqual(['abcd']);
			expect(row).toBe(0);
			expect(col).toBe(4);
		});

		it('does nothing when already at the beginning of the document', () => {
			const code = ['ab'];
			expect(backSpace(code, 0, 0)).toEqual({ code, row: 0, col: 0 });
		});
	});
}
