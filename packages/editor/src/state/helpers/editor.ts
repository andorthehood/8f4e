import { instructions } from '@8f4e/compiler';
import { ModuleGraphicData } from '../types';
import { font } from '@8f4e/sprite-generator';

export function moveCaret(
	code: string[],
	row: number,
	col: number,
	direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Jump'
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
		case 'Jump':
			col = Math.max(Math.min(col, code[row].length), 0);
			row = row = Math.min(row, code.length - 1);
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

/**
 *
 *  +------------
 *  | 0 Line 0
 *  +------------
 *  | 1 Line 1   gap.size = 2
 *  +------------
 *  | 2 gap
 *  +-----------
 *  | 3 gap
 *  +-------------
 *  | 4 Line 2
 *  +--------------
 *  | 5 Line 3    gap.size = 3
 *  +--------------
 *  | 6 gap
 *  +---------------
 *  | 7 gap
 *  +------------
 *  | 8 gap
 *  +---------
 *  | 9 Line 4
 *  +----------
 *  | 10 Line 5
 *  +-------------
 * @returns
 */

export function gapCalculator(row: number, gaps: ModuleGraphicData['gaps']) {
	let physicalRowCounter = row;
	for (const [gapStarLine, { size }] of gaps) {
		if (row > gapStarLine) {
			physicalRowCounter += size;
		}
	}
	return physicalRowCounter;
}

export function reverseGapCalculator(physicalRow, gaps: ModuleGraphicData['gaps']) {
	// TODO implement
	return physicalRow;
}


const keywords = new RegExp(
	'\\b(?:' +
		Object.keys(instructions)
			.sort((a, b) => b.length - a.length)
			.join('|')
			.replaceAll(/\*/g, '\\*')
			.replaceAll(/\]/g, '\\]')
			.replaceAll(/\[/g, '\\[') +
		')\\b',
	'd'
);

export function generateCodeColorMap(code: string[]) {
	return code.map(line => {
		const { index: lineNumberIndex } = /^\d+/.exec(line) || {};
		const { indices: instructionIndices } = keywords.exec(line) || {};
		const { index: numberIndex } = /(?!^)\b(\d+|0b[01]+|0x[\dabcdef]+)\b/.exec(line) || {};
		const { index: commentIndex } = /;/.exec(line) || {};

		const codeColors = new Array(line.length).fill(undefined);

		if (typeof lineNumberIndex !== 'undefined') {
			codeColors[lineNumberIndex] = font('grey');
		}

		if (typeof instructionIndices !== 'undefined') {
			codeColors[instructionIndices[0][0]] = font('purple');
			codeColors[instructionIndices[0][1]] = font('white');
		}

		if (typeof commentIndex !== 'undefined') {
			codeColors[commentIndex] = font('light_grey');
		}

		if (typeof numberIndex !== 'undefined') {
			codeColors[numberIndex] = font('lime');
		}

		return codeColors;
	});
}