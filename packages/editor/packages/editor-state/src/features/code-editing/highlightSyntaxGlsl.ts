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
 * All GLSL keywords combined and pre-sorted for regex compilation
 */
const allGlslKeywords = [...glslKeywords, ...glslTypes].sort((a, b) => b.length - a.length);

/**
 * Pre-compiled regex for matching GLSL keywords
 */
const glslKeywordRegExp = new RegExp('\\b(?:' + allGlslKeywords.join('|') + ')\\b', 'd');

/**
 * Generates a 2D lookup where each cell contains the sprite used to render a code character.
 * Applies GLSL language syntax highlighting rules.
 * @param code Program text split into lines (raw code without line numbers).
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
	return code.map(line => {
		const keywordMatch = glslKeywordRegExp.exec(line);
		const keywordIndices = (keywordMatch as unknown as { indices?: number[][] })?.indices || [[]];
		const { index: numberIndex } = /-?\b(\d+\.?\d*|\d*\.\d+|0x[\dabcdef]+)\b/.exec(line) || {};
		const { index: lineCommentIndex } = /\/\//.exec(line) || {};
		const blockCommentStartMatch = /\/\*/.exec(line);
		const { index: blockCommentStartIndex } = blockCommentStartMatch || { index: undefined };
		const { index: preprocessorIndex } = /^\s*#/.exec(line) || {};

		const codeColors = new Array(line.length).fill(undefined);

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
				'#version 300 es',
				'precision mediump float;',
				'',
				'#define PI 3.14159',
				'#define ITERATIONS 10',
				'',
				'// Varyings and uniforms',
				'varying vec2 v_texCoord;',
				'uniform sampler2D u_texture;',
				'uniform float u_time;',
				'uniform vec3 u_color;',
				'',
				'/* Helper function',
				'   for color blending */',
				'vec4 blend(vec4 a, vec4 b) {',
				'  float factor = 0.5;',
				'  int mask = 0xff;',
				'  if (factor > 0.0) {',
				'    return a * factor;',
				'  } else {',
				'    return b;',
				'  }',
				'}',
				'',
				'void main() {',
				'  vec2 uv = v_texCoord;',
				'  float dist = length(uv);',
				'  ',
				'  for (int i = 0; i < ITERATIONS; i++) {',
				'    dist += 0.1;',
				'  }',
				'  ',
				'  while (dist > 1.0) {',
				'    dist -= 0.5;',
				'    break;',
				'  }',
				'  ',
				'  vec4 color = texture2D(u_texture, uv);',
				'  gl_FragColor = blend(color, vec4(u_color, 1.0));',
				'}',
			];

			const result = highlightSyntaxGlsl(glslCode, spriteLookups);
			expect(result).toMatchSnapshot();
		});
	});
}
