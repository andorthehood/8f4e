import { instructionParser } from './instructionParser';

/**
 * Extracts the identifier provided to the first module instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The module identifier or an empty string when none is found.
 */
export function getModuleId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(instructionParser) || [];
		if (instruction === 'module') {
			return args[0] || '';
		}
	}
	return '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getModuleId', () => {
		it('returns the module identifier', () => {
			expect(getModuleId(['module foo', 'moduleEnd'])).toBe('foo');
		});

		it('returns empty string when missing', () => {
			expect(getModuleId(['function foo', 'functionEnd'])).toBe('');
		});
	});
}
