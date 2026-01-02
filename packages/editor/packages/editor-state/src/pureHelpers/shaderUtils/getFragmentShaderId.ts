import { instructionParser } from '@8f4e/compiler/syntax';

/**
 * Extracts the identifier provided to the first fragmentShader instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The fragment shader identifier or an empty string when none is found.
 */
export default function getFragmentShaderId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
		if (instruction === 'fragmentShader') {
			return args[0] || '';
		}
	}
	return '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getFragmentShaderId', () => {
		it('returns the fragment shader identifier', () => {
			expect(getFragmentShaderId(['fragmentShader crt', 'fragmentShaderEnd'])).toBe('crt');
		});

		it('returns empty string when missing', () => {
			expect(getFragmentShaderId(['module foo', 'moduleEnd'])).toBe('');
		});

		it('returns empty string when no ID is provided', () => {
			expect(getFragmentShaderId(['fragmentShader', 'fragmentShaderEnd'])).toBe('');
		});
	});
}
