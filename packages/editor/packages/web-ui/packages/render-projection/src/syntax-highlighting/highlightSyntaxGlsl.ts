import type { SyntaxFonts, SyntaxHighlighting } from './types';

const glslKeywordRegExp = new RegExp(
	'\\b(?:' +
		[
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
		]
			.sort((a, b) => b.length - a.length)
			.join('|') +
		')\\b',
	'd'
);

export default function highlightSyntaxGlsl<T>(code: string[], fonts: SyntaxFonts<T>): SyntaxHighlighting<T> {
	return code.map(line => {
		const colors = new Array<T | undefined>(line.length).fill(undefined);
		const keywordMatch = glslKeywordRegExp.exec(line);
		const indices = (keywordMatch as unknown as { indices?: number[][] })?.indices?.[0];
		const numberIndex = /-?\b(\d+\.?\d*|\d*\.\d+|0x[\dabcdef]+)\b/.exec(line)?.index;
		const lineCommentIndex = /\/\//.exec(line)?.index;
		const blockCommentIndex = /\/\*/.exec(line)?.index;
		const preprocessorIndex = /^\s*#/.exec(line)?.index;

		if (preprocessorIndex !== undefined) colors[preprocessorIndex] = fonts.fontInstruction;
		if (indices?.length === 2) {
			colors[indices[0]] = fonts.fontInstruction;
			colors[indices[1]] = fonts.fontCode;
		}
		if (lineCommentIndex !== undefined) colors[lineCommentIndex] = fonts.fontCodeComment;
		if (blockCommentIndex !== undefined) colors[blockCommentIndex] = fonts.fontCodeComment;
		if (numberIndex !== undefined) colors[numberIndex] = fonts.fontNumbers;
		return colors;
	});
}
