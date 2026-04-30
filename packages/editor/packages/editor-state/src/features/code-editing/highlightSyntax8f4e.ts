import highlightEditorDirective from './highlightEditorDirective';

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
	'return',
	'storeBytes',
	'int',
	'float',
	'int*',
	'int**',
	'int8*',
	'int8**',
	'int16*',
	'int16**',
	'float*',
	'float**',
	'float64',
	'float64*',
	'float64**',
	'float[]',
	'float64[]',
	'int[]',
	'int8[]',
	'int8u[]',
	'int16[]',
	'int16u[]',
	'int32[]',
	'float64*[]',
	'float64**[]',
	'float*[]',
	'float**[]',
	'int*[]',
	'int**[]',
	'castToInt',
	'castToFloat',
	'castToFloat64',
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
	'branchIfUnchanged',
	'init',
	'pow2',
	'sqrt',
	'loadFloat',
	'round',
	'ensureNonZero',
	'function',
	'functionEnd',
	'call',
	'param',
	'constants',
	'constantsEnd',
	'defineMacro',
	'defineMacroEnd',
	'macro',
	'mapBegin',
	'map',
	'default',
	'mapEnd',
	'note',
	'noteEnd',
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
		fontBasePrefix: T;
	}
): T[][] {
	const getCommentIndex = (line: string): number | undefined => {
		const semicolonIndex = line.indexOf(';');
		const hashCommentMatch = /^\s*#/.exec(line);
		const hashCommentIndex = hashCommentMatch ? hashCommentMatch[0].length - 1 : -1;

		if (semicolonIndex === -1 && hashCommentIndex === -1) {
			return undefined;
		}
		if (semicolonIndex === -1) {
			return hashCommentIndex;
		}
		if (hashCommentIndex === -1) {
			return semicolonIndex;
		}

		return Math.min(semicolonIndex, hashCommentIndex);
	};

	const getDefaultColorAtIndex = (line: string, index: number, commentIndex: number | undefined): T => {
		if (line[index] === '\t' || commentIndex === index) {
			return spriteLookups.fontCodeComment;
		}

		return spriteLookups.fontCode;
	};

	return code.map(line => {
		const commentIndex = getCommentIndex(line);
		const instructionMatch = getInstructionRegExp(instructionsToHighlight).exec(line);
		const instructionIndices = (instructionMatch as unknown as { indices?: number[][] })?.indices || [[]];
		const numberMatches = line.matchAll(/(?<![#\w])-?(?:\d+|0b[01]+|0x[\da-f]+)\b/gi);
		const binaryNumberMatches = line.matchAll(/0b([01]+)/g);
		const hexNumberMatches = line.matchAll(/0x([\da-f]+)/gi);

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

		for (let i = 0; i < line.length; i += 1) {
			if (line[i] === '\t') {
				codeColors[i] = spriteLookups.fontCodeComment;

				const nextIndex = i + 1;
				if (nextIndex < line.length) {
					codeColors[nextIndex] = getDefaultColorAtIndex(line, nextIndex, commentIndex);
				}
			}
		}

		for (const match of numberMatches) {
			if (typeof match.index === 'number' && isBeforeComment(match.index)) {
				codeColors[match.index] = spriteLookups.fontNumbers;

				const endIndex = match.index + match[0].length;
				if (endIndex < line.length) {
					codeColors[endIndex] = getDefaultColorAtIndex(line, endIndex, commentIndex);
				}
			}
		}

		for (const binaryNumberMatch of binaryNumberMatches) {
			if (typeof binaryNumberMatch.index !== 'number' || !isBeforeComment(binaryNumberMatch.index)) {
				continue;
			}

			const binaryNumberIndex = binaryNumberMatch.index;
			const binaryNumber = binaryNumberMatch[1] || '';
			const binaryZeros = binaryNumber.matchAll(/(0+)/g);
			const binaryOnes = binaryNumber.matchAll(/(1+)/g);

			codeColors[binaryNumberIndex] = spriteLookups.fontBasePrefix;

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

		for (const hexNumberMatch of hexNumberMatches) {
			if (typeof hexNumberMatch.index !== 'number' || !isBeforeComment(hexNumberMatch.index)) {
				continue;
			}

			codeColors[hexNumberMatch.index] = spriteLookups.fontBasePrefix;
			codeColors[hexNumberMatch.index + 2] = spriteLookups.fontNumbers;
		}

		highlightEditorDirective(line, codeColors, spriteLookups.fontCode, spriteLookups.fontCodeComment);

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
		fontBasePrefix: 'prefix',
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
				'; @watch count',
				'; @plot &buffer',
				'push 1 ; @watch counter',
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
				'if',
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
				'push 0',
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
				'; Tab-separated numeric arguments',
				'int foo\t1\t2\t3',
				'push\t123',
				'int\tCONST',
				'',
				'; Numbers inside brackets',
				'init foo[0]',
				'',
				'; Constant names with # digits',
				'const C#7',
				'const GB7',
				'',
				'; Hash comment edge cases',
				'const A#0 22',
				'  # comment',
				'const FOOBAR 42 # comment',
				'',
				'; Float64 instructions',
				'float64**[] OUT',
				'castToFloat64',
				'',
				'moduleEnd',
			];

			const result = highlightSyntax8f4e(code8f4e, spriteLookups);
			expect(result).toMatchSnapshot();
		});
	});
}
