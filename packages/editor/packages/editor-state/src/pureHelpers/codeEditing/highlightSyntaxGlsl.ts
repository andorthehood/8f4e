/**
 * GLSL language keywords to highlight
 */
const glslKeywords = [
	'if',
	'else',
	'for',
	'while',
	'return',
	'break',
	'continue',
	'discard',
	'varying',
	'uniform',
	'precision',
];

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
	'mediump',
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
		it('highlights GLSL shader code with keywords, types, comments, numbers, and preprocessor directives', () => {
			const glslCode = [
				'00 #version 300 es',
				'01 precision mediump float;',
				'02 ',
				'03 #define PI 3.14159',
				'04 #define ITERATIONS 10',
				'05 ',
				'06 // Varyings and uniforms',
				'07 varying vec2 v_texCoord;',
				'08 uniform sampler2D u_texture;',
				'09 uniform float u_time;',
				'10 uniform vec3 u_color;',
				'11 ',
				'12 /* Helper function',
				'13    for color blending */',
				'14 vec4 blend(vec4 a, vec4 b) {',
				'15   float factor = 0.5;',
				'16   int mask = 0xff;',
				'17   if (factor > 0.0) {',
				'18     return a * factor;',
				'19   } else {',
				'20     return b;',
				'21   }',
				'22 }',
				'23 ',
				'24 void main() {',
				'25   vec2 uv = v_texCoord;',
				'26   float dist = length(uv);',
				'27   ',
				'28   for (int i = 0; i < ITERATIONS; i++) {',
				'29     dist += 0.1;',
				'30   }',
				'31   ',
				'32   while (dist > 1.0) {',
				'33     dist -= 0.5;',
				'34     break;',
				'35   }',
				'36   ',
				'37   vec4 color = texture2D(u_texture, uv);',
				'38   gl_FragColor = blend(color, vec4(u_color, 1.0));',
				'39 }',
			];

			const result = highlightSyntaxGlsl(glslCode, spriteLookups);
			expect(result).toMatchSnapshot();
		});
	});
}
