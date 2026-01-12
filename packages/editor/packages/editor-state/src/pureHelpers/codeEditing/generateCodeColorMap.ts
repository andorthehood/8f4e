/**
 * Builds a deterministic regexp that matches instructions while preferring longer tokens.
 * @param instructions Instruction mnemonics that should be highlighted.
 * @returns Regular expression used to find instruction boundaries with indices data.
 */
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

/**
 * 8f4e language instruction keywords to highlight
 */
const instructionsToHighlight = [
	'and',
	'or',
	'const',
	'load',
	'load8u',
	'load16u',
	'load8s',
	'load16s',
	'localGet',
	'localSet',
	'else',
	'if',
	'ifEnd',
	'lessThan',
	'store',
	'sub',
	'div',
	'xor',
	'local',
	'greaterOrEqual',
	'add',
	'greaterThan',
	'branch',
	'branchIfTrue',
	'push',
	'block',
	'blockEnd',
	'lessOrEqual',
	'mul',
	'loop',
	'loopEnd',
	'greaterOrEqualUnsigned',
	'equalToZero',
	'shiftLeft',
	'shiftRight',
	'shiftRightUnsigned',
	'remainder',
	'module',
	'moduleEnd',
	'config',
	'configEnd',
	'set',
	'scope',
	'rescope',
	'rescopeTop',
	'popScope',
	'int',
	'float',
	'int*',
	'int**',
	'float*',
	'float**',
	'float[]',
	'int[]',
	'int8[]',
	'int16[]',
	'int32[]',
	'float*[]',
	'float**[]',
	'int*[]',
	'int**[]',
	'castToInt',
	'castToFloat',
	'skip',
	'drop',
	'clearStack',
	'risingEdge',
	'fallingEdge',
	'hasChanged',
	'dup',
	'swap',
	'cycle',
	'abs',
	'use',
	'equal',
	'wasm',
	'branchIfUnchanged',
	'init',
	'pow2',
	'sqrt',
	'loadFloat',
	'round',
	'ensureNonZero',
	'function',
	'functionEnd',
	'initBlock',
	'initBlockEnd',
	'concat',
	'call',
	'param',
	'constants',
	'constantsEnd',
	'vertexShader',
	'vertexShaderEnd',
	'fragmentShader',
	'fragmentShaderEnd',
];

/**
 * Generates a 2D lookup where each cell contains the sprite used to render a code character.
 * Applies 8f4e language syntax highlighting rules.
 * @param code Program text split into lines.
 * @param spriteLookups Mapping of syntax roles to sprite identifiers.
 * @returns A matrix of sprite identifiers aligned to every character in the document.
 */
export default function highlightSyntax8f4e<T>(
	code: string[],
	spriteLookups: {
		fontLineNumber: T;
		fontInstruction: T;
		fontCode: T;
		fontCodeComment: T;
		fontNumbers: T;
		fontBinaryZero: T;
		fontBinaryOne: T;
	}
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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const spriteLookups = {
		fontLineNumber: 'line',
		fontInstruction: 'instruction',
		fontCode: 'code',
		fontCodeComment: 'comment',
		fontNumbers: 'number',
		fontBinaryZero: 'zero',
		fontBinaryOne: 'one',
	} as const;

	describe('highlightSyntax8f4e', () => {
		it('marks line numbers when present', () => {
			const [line] = highlightSyntax8f4e(['10 add'], spriteLookups);
			expect(line[0]).toBe('line');
		});

		it('highlights instructions, comments, and numeric literals', () => {
			const [line] = highlightSyntax8f4e(['add 10 ; comment'], spriteLookups);
			expect(line[0]).toBe('instruction');
			expect(line[3]).toBe('code');
			expect(line[4]).toBe('number');
			expect(line[7]).toBe('comment');
		});

		it('marks binary digits separately for zeros and ones', () => {
			const [line] = highlightSyntax8f4e(['const 0b1010'], spriteLookups);
			expect(line[8]).toBe('one');
			expect(line[9]).toBe('zero');
			expect(line[10]).toBe('one');
			expect(line[11]).toBe('zero');
		});
	});
}
