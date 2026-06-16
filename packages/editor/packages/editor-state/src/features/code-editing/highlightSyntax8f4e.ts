import { knownInstructionNameSet } from '@8f4e/language-spec';

import highlightEditorDirective from './highlightEditorDirective';

/**
 * Builds a deterministic regexp that matches instructions while preferring longer tokens.
 * @param instructions Instruction mnemonics that should be highlighted.
 * @returns Regular expression used to find instruction boundaries with indices data.
 */
const getInstructionRegExp = (instructions: Iterable<string>) =>
	new RegExp(
		'(?<=^|\\s)(?:' +
			[...instructions]
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
const instructionRegExp = getInstructionRegExp(knownInstructionNameSet);

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
		const instructionMatch = instructionRegExp.exec(line);
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
