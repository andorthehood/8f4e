import instructionParser from './instructionParser';

/**
 * Extracts the identifier provided to the first vertexShader instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The vertex shader identifier or an empty string when none is found.
 */
export default function getVertexShaderId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
		if (instruction === 'vertexShader') {
			return args[0] || '';
		}
	}
	return '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getVertexShaderId', () => {
		it('returns the vertex shader identifier', () => {
			expect(getVertexShaderId(['vertexShader crt', 'vertexShaderEnd'])).toBe('crt');
		});

		it('returns empty string when missing', () => {
			expect(getVertexShaderId(['module foo', 'moduleEnd'])).toBe('');
		});

		it('returns empty string when no ID is provided', () => {
			expect(getVertexShaderId(['vertexShader', 'vertexShaderEnd'])).toBe('');
		});
	});
}
