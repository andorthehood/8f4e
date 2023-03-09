export function moveCaret(
	code: string[],
	row: number,
	col: number,
	direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
): [row: number, col: number] {
	switch (direction) {
		case 'ArrowUp':
			row = Math.max(row - 1, 0);

			if (!code[row][col]) {
				col = code[row].length;
			}

			return [row, col];
		case 'ArrowDown':
			row = Math.min(row + 1, code.length - 1);

			if (!code[row][col]) {
				col = code[row].length;
			}

			return [row, col];
		case 'ArrowLeft':
			col = Math.max(col - 1, 0);
			return [row, col];
		case 'ArrowRight':
			col = Math.min(col + 1, code[row].length);
			return [row, col];
	}
}

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
		return { code: newCode, row: newRow, col: code[newRow].length };
	}

	return { code, row, col };
}

export function type(
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

export function enter(
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
