/**
 * Builds a deterministic regexp that matches instructions while preferring longer tokens.
 * @param instructions Instruction mnemonics that should be highlighted.
 * @returns Regular expression used to find instruction boundaries with indices data.
 */
const getInstructionRegExp = (instructions: string[]) =>
	new RegExp(
		'(?<=^|\\s)(?:' +
			instructions
				.sort((a, b) => b.length - a.length)
				.join('|')
				.replaceAll(/\*/g, '\\*')
				.replaceAll(/\]/g, '\\]')
				.replaceAll(/\[/g, '\\[') +
			')(?=\\s|$)',
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
	'int8u[]',
	'int16[]',
	'int16u[]',
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
	'concat',
	'call',
	'param',
	'constants',
	'constantsEnd',
	'defineMacro',
	'defineMacroEnd',
	'macro',
	'vertexShader',
	'vertexShaderEnd',
	'fragmentShader',
	'fragmentShaderEnd',
	'comment',
	'commentEnd',
];

/**
 * Generates a 2D lookup where each cell contains the sprite used to render a code character.
 * Applies 8f4e language syntax highlighting rules.
 * @param code Program text split into lines (raw code without line numbers).
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
		const { index: commentIndex } = /[;#]/.exec(line) || {};
		const instructionMatch = getInstructionRegExp(instructionsToHighlight).exec(line);
		const instructionIndices = (instructionMatch as unknown as { indices?: number[][] })?.indices || [[]];
		const { index: numberIndex } = /-?\b(\d+|0b[01]+|0x[\dabcdef]+)\b/.exec(line) || {};
		const binaryNumberMatch = /0b([01]+)/.exec(line);
		const { index: binaryNumberIndex } = binaryNumberMatch || { index: undefined };
		const binaryNumber = binaryNumberMatch?.[1] || '';
		const binaryZeros = binaryNumber.matchAll(/(0+)/g);
		const binaryOnes = binaryNumber.matchAll(/(1+)/g);

		const codeColors = new Array(line.length).fill(undefined);
		const isBeforeComment = (index: number) => typeof commentIndex === 'undefined' || index < commentIndex;

		if (
			instructionMatch &&
			instructionIndices.length > 0 &&
			instructionIndices[0].length >= 2 &&
			isBeforeComment(instructionMatch.index)
		) {
			codeColors[instructionIndices[0][0]] = spriteLookups.fontInstruction;
			codeColors[instructionIndices[0][1]] = spriteLookups.fontCode;
		}

		if (typeof commentIndex !== 'undefined') {
			codeColors[commentIndex] = spriteLookups.fontCodeComment;
		}

		if (typeof numberIndex === 'number' && isBeforeComment(numberIndex)) {
			codeColors[numberIndex] = spriteLookups.fontNumbers;
		}

		if (typeof binaryNumberIndex === 'number' && isBeforeComment(binaryNumberIndex)) {
			for (const match of binaryZeros) {
				if (typeof match.index === 'number') {
					codeColors[match.index + binaryNumberIndex + 2] = spriteLookups.fontBinaryZero;
				}
			}
			for (const match of binaryOnes) {
				if (typeof match.index === 'number') {
					codeColors[match.index + binaryNumberIndex + 2] = spriteLookups.fontBinaryOne;
				}
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
				'module audioout',
				'',
				'float* in &saw.out',
				'int channel LEFT_CHANNEL',
				'',
				'; Audio buffer',
				'float[] buffer AUDIO_BUFFER_SIZE',
				'int pointer &buffer',
				'',
				'; @debug count',
				'; @plot buffer -2 2',
				'',
				'; Store the input value',
				'; in the buffer',
				'push pointer',
				'push *in',
				'store',
				'',
				'; Increment the buffer pointer',
				'; by the buffer element size',
				'push &pointer',
				'push pointer',
				'push %buffer',
				'add',
				'store',
				'',
				'; Reset when reaching end',
				'push pointer',
				'push buffer&',
				'greaterThan',
				'if void',
				'  push &pointer',
				'  push &buffer',
				'  store',
				'ifEnd',
				'',
				'; Binary flags',
				'const 0b1010',
				'const 0b1100',
				'and',
				'',
				'; Hex values',
				'push 0xff',
				'push 0x100',
				'mul',
				'',
				'; Conditional logic',
				'localGet 0',
				'push 10',
				'lessThan',
				'branchIfTrue',
				'',
				'; this is a push comment',
				'; this is a push comment 0b1010',
				'',
				'; Bracketed types',
				'int8[] buffer1 10',
				'int8u[] buffer2 20',
				'int16[] buffer3 30',
				'int16u[] buffer4 40',
				'',
				'moduleEnd',
			];

			const result = highlightSyntax8f4e(code8f4e, spriteLookups);
			expect(result).toMatchSnapshot();
		});
	});
}
