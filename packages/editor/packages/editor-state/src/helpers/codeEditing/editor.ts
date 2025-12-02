import type { CodeBlockGraphicData } from '../../types';

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

			if (row > code.length - 1) {
				return [code.length - 1, col];
			}

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

export function gapCalculator(row: number, gaps: CodeBlockGraphicData['gaps']) {
	let physicalRowCounter = row;
	for (const [gapStartLine, { size }] of gaps) {
		if (row > gapStartLine) {
			physicalRowCounter += size;
		}
	}
	return physicalRowCounter;
}

export function reverseGapCalculator(physicalRow: number, gaps: CodeBlockGraphicData['gaps']) {
	let startLineOffset = 0;
	for (const [gapStartLine, { size }] of gaps) {
		if (physicalRow > gapStartLine + startLineOffset) {
			startLineOffset += size;
		}
	}

	return Math.max(physicalRow - startLineOffset, 0);
}

const getInstructionRegExp = (instructions: string[]) =>
	new RegExp(
		'\\b(?:' +
			instructions
				.sort((a, b) => b.length - a.length)
				.join('|')
				.replaceAll(/\*/g, '\\*')
				.replaceAll(/\]/g, '\\]')
				.replaceAll(/\[/g, '\\[') +
			')\\b',
		'd'
	);

export function generateCodeColorMap<T>(
	code: string[],
	spriteLookups: {
		fontLineNumber: T;
		fontInstruction: T;
		fontCode: T;
		fontCodeComment: T;
		fontNumbers: T;
		fontBinaryZero: T;
		fontBinaryOne: T;
	},
	instructionsToHighlight: string[]
): T[][] {
	return code.map(line => {
		const { index: lineNumberIndex } = /^\d+/.exec(line) || {};
		const instructionMatch = getInstructionRegExp(instructionsToHighlight).exec(line);
		const instructionIndices = (instructionMatch as unknown as { indices?: number[][] })?.indices || [[]];
		const { index: numberIndex } = /(?!^)(?:-|)\b(\d+|0b[01]+|0x[\dabcdef]+)\b/.exec(line) || {};
		const { index: commentIndex } = /;/.exec(line) || {};
		const binaryNumberMatch = /0b([01]+)/.exec(line);
		const { index: binaryNumberIndex } = binaryNumberMatch || { index: undefined };
		const binaryNumber = binaryNumberMatch?.[1] || '';
		const binaryZeros = binaryNumber.matchAll(/(0+)/g);
		const binaryOnes = binaryNumber.matchAll(/(1+)/g);

		const codeColors = new Array(line.length).fill(undefined);

		if (typeof lineNumberIndex !== 'undefined') {
			codeColors[lineNumberIndex] = spriteLookups.fontLineNumber;
		}

		if (instructionIndices.length > 0 && instructionIndices[0].length >= 2) {
			codeColors[instructionIndices[0][0]] = spriteLookups.fontInstruction;
			codeColors[instructionIndices[0][1]] = spriteLookups.fontCode;
		}

		if (typeof commentIndex !== 'undefined') {
			codeColors[commentIndex] = spriteLookups.fontCodeComment;
		}

		if (typeof numberIndex !== 'undefined') {
			codeColors[numberIndex] = spriteLookups.fontNumbers;
		}

		if (binaryZeros && typeof binaryNumberIndex !== 'undefined') {
			for (const match of binaryZeros) {
				codeColors[match.index + binaryNumberIndex + 2] = spriteLookups.fontBinaryZero;
			}
		}

		if (binaryOnes && typeof binaryNumberIndex !== 'undefined') {
			for (const match of binaryOnes) {
				codeColors[match.index + binaryNumberIndex + 2] = spriteLookups.fontBinaryOne;
			}
		}

		return codeColors;
	});
}
