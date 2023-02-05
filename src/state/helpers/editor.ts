export function moveCaret(
	code: string[],
	row: number,
	col: number,
	direction: 'up' | 'down' | 'left' | 'right'
): [row: number, col: number] {
	switch (direction) {
		case 'up':
			row = Math.max(row - 1, 0);

			if (!code[row][col]) {
				col = code[row].length;
			}

			return [row, col];
		case 'down':
			row = Math.min(row + 1, code.length - 1);

			if (!code[row][col]) {
				col = code[row].length;
			}

			return [row, col];
		case 'left':
			col = Math.max(col - 1, 0);
			return [row, col];
		case 'right':
			col = Math.min(col + 1, code[row].length);
			return [row, col];
	}
}

export function backSpace(code: string[], row: number, col: number): { code: string[]; row: number; col: number } {
	const [newRow, newCol] = moveCaret(code, row, col, 'left');
	const newCode = [...code];
	if (col > 0) {
		newCode[row] = newCode[row].slice(0, newCol) + newCode[row].slice(newCol + 1);
	}
	return { code: newCode, row: newRow, col: newCol };
}

export function type(
	code: string[],
	row: number,
	col: number,
	char: string
): { code: string[]; row: number; col: number } {
	const newCode = [...code];
	newCode[row] = newCode[row].substring(0, col) + char + newCode[row].substring(col);
	const [newRow, newCol] = moveCaret(newCode, row, col, 'right');
	return {
		code: newCode,
		row: newRow,
		col: newCol,
	};
}
