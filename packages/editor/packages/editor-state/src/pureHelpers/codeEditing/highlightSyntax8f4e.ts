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
		it('highlights 8f4e code with instructions, comments, numbers, and binary literals', () => {
			const code8f4e = [
				'00 module audioout',
				'01 ',
				'02 float* in &saw.out',
				'03 int channel LEFT_CHANNEL',
				'04 ',
				'05 ; Audio buffer',
				'06 float[] buffer AUDIO_BUFFER_SIZE',
				'07 int pointer &buffer',
				'08 ',
				'09 debug count',
				'10 plot buffer -2 2',
				'11 ',
				'12 ; Store the input value',
				'13 ; in the buffer',
				'14 push pointer',
				'15 push *in',
				'16 store',
				'17 ',
				'18 ; Increment the buffer pointer',
				'19 ; by the word size (4 bytes)',
				'20 push &pointer',
				'21 push pointer',
				'22 push WORD_SIZE',
				'23 add',
				'24 store',
				'25 ',
				'26 ; Reset when reaching end',
				'27 push pointer',
				'28 push buffer&',
				'29 greaterThan',
				'30 if void',
				'31   push &pointer',
				'32   push &buffer',
				'33   store',
				'34 ifEnd',
				'35 ',
				'36 ; Binary flags',
				'37 const 0b1010',
				'38 const 0b1100',
				'39 and',
				'40 ',
				'41 ; Hex values',
				'42 push 0xff',
				'43 push 0x100',
				'44 mul',
				'45 ',
				'46 ; Conditional logic',
				'47 localGet 0',
				'48 push 10',
				'49 lessThan',
				'50 branchIfTrue',
				'51 ',
				'52 moduleEnd',
			];

			const result = highlightSyntax8f4e(code8f4e, spriteLookups);
			expect(result).toMatchSnapshot();
		});
	});
}
