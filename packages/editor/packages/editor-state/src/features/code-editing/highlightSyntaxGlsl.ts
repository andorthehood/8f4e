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
		fontBasePrefix: T;
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
