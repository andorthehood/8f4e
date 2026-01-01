import { instructionParser } from './instructionParser';

/**
 * Extracts the identifier provided to the first constants instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The constants identifier or an empty string when none is found.
 */
export function getConstantsId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
		if (instruction === 'constants') {
			return args[0] || '';
		}
	}
	return '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getConstantsId', () => {
		it('returns the constants identifier', () => {
			expect(getConstantsId(['constants math', 'constantsEnd'])).toBe('math');
		});

		it('returns empty string when missing', () => {
			expect(getConstantsId(['module foo', 'moduleEnd'])).toBe('');
		});
	});
}
