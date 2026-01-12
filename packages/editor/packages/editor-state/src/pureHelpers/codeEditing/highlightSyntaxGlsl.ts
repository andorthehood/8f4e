/**
 * GLSL language keywords to highlight
 */
const glslKeywords = ['if', 'else', 'for', 'while', 'return', 'break', 'continue', 'discard'];

/**
 * GLSL type keywords to highlight
 */
const glslTypes = [
	'void',
	'bool',
	'int',
	'float',
	'vec2',
	'vec3',
	'vec4',
	'mat2',
	'mat3',
	'mat4',
	'sampler2D',
	'samplerCube',
];

/**
 * Builds a deterministic regexp that matches keywords while preferring longer tokens.
 * @param keywords Keywords that should be highlighted.
 * @returns Regular expression used to find keyword boundaries with indices data.
 */
const getKeywordRegExp = (keywords: string[]) =>
	new RegExp('\\b(?:' + keywords.sort((a, b) => b.length - a.length).join('|') + ')\\b', 'd');

/**
 * Generates a 2D lookup where each cell contains the sprite used to render a code character.
 * Applies GLSL language syntax highlighting rules.
 * @param code Program text split into lines.
 * @param spriteLookups Mapping of syntax roles to sprite identifiers.
 * @returns A matrix of sprite identifiers aligned to every character in the document.
 */
export default function highlightSyntaxGlsl<T>(
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
	const allKeywords = [...glslKeywords, ...glslTypes];

	return code.map(line => {
		const { index: lineNumberIndex } = /^\d+/.exec(line) || {};
		const keywordMatch = getKeywordRegExp(allKeywords).exec(line);
		const keywordIndices = (keywordMatch as unknown as { indices?: number[][] })?.indices || [[]];
		const { index: numberIndex } = /(?!^)(?:-|)\b(\d+\.?\d*|\d*\.\d+|0x[\dabcdef]+)\b/.exec(line) || {};
		const { index: lineCommentIndex } = /\/\//.exec(line) || {};
		const blockCommentStartMatch = /\/\*/.exec(line);
		const { index: blockCommentStartIndex } = blockCommentStartMatch || { index: undefined };
		const { index: preprocessorIndex } = /^\s*#/.exec(line) || {};

		const codeColors = new Array(line.length).fill(undefined);

		// Line numbers
		if (typeof lineNumberIndex !== 'undefined') {
			codeColors[lineNumberIndex] = spriteLookups.fontLineNumber;
		}

		// Preprocessor directives (use instruction color as specified)
		if (typeof preprocessorIndex !== 'undefined') {
			codeColors[preprocessorIndex] = spriteLookups.fontInstruction;
		}

		// Keywords (use instruction color for syntax keywords)
		if (keywordIndices.length > 0 && keywordIndices[0].length >= 2) {
			codeColors[keywordIndices[0][0]] = spriteLookups.fontInstruction;
			codeColors[keywordIndices[0][1]] = spriteLookups.fontCode;
		}

		// Line comments
		if (typeof lineCommentIndex !== 'undefined') {
			codeColors[lineCommentIndex] = spriteLookups.fontCodeComment;
		}

		// Block comments (just mark the start)
		if (typeof blockCommentStartIndex !== 'undefined') {
			codeColors[blockCommentStartIndex] = spriteLookups.fontCodeComment;
		}

		// Numbers
		if (typeof numberIndex !== 'undefined') {
			codeColors[numberIndex] = spriteLookups.fontNumbers;
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

	describe('highlightSyntaxGlsl', () => {
		it('marks line numbers when present', () => {
			const [line] = highlightSyntaxGlsl(['10 float x = 1.0;'], spriteLookups);
			expect(line[0]).toBe('line');
		});

		it('highlights GLSL keywords', () => {
			const [line] = highlightSyntaxGlsl(['if (x > 0.0)'], spriteLookups);
			expect(line[0]).toBe('instruction');
			expect(line[2]).toBe('code');
		});

		it('highlights GLSL types', () => {
			const [line] = highlightSyntaxGlsl(['vec3 color;'], spriteLookups);
			expect(line[0]).toBe('instruction');
			expect(line[4]).toBe('code');
		});

		it('highlights line comments', () => {
			const [line] = highlightSyntaxGlsl(['float x; // comment'], spriteLookups);
			expect(line[9]).toBe('comment');
		});

		it('highlights block comments', () => {
			const [line] = highlightSyntaxGlsl(['float x; /* comment */'], spriteLookups);
			expect(line[9]).toBe('comment');
		});

		it('highlights numeric literals including floats', () => {
			const [line] = highlightSyntaxGlsl(['float x = 1.5;'], spriteLookups);
			expect(line[10]).toBe('number');
		});

		it('highlights preprocessor directives', () => {
			const [line] = highlightSyntaxGlsl(['#version 300 es'], spriteLookups);
			expect(line[0]).toBe('instruction');
		});

		it('highlights hex numbers', () => {
			const [line] = highlightSyntaxGlsl(['int x = 0xff;'], spriteLookups);
			expect(line[8]).toBe('number');
		});
	});
}
