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

	describe('generateCodeColorMap', () => {
		it('marks line numbers when present', () => {
			const [line] = generateCodeColorMap(['10 NOP'], spriteLookups, ['NOP']);
			expect(line[0]).toBe('line');
		});

		it('highlights instructions, comments, and numeric literals', () => {
			const [line] = generateCodeColorMap(['NOP 10 ; comment'], spriteLookups, ['NOP']);
			expect(line[0]).toBe('instruction');
			expect(line[3]).toBe('code');
			expect(line[4]).toBe('number');
			expect(line[7]).toBe('comment');
		});

		it('marks binary digits separately for zeros and ones', () => {
			const [line] = generateCodeColorMap(['DATA 0b1010'], spriteLookups, ['DATA']);
			expect(line[7]).toBe('one');
			expect(line[8]).toBe('zero');
			expect(line[9]).toBe('one');
			expect(line[10]).toBe('zero');
		});
	});
}
