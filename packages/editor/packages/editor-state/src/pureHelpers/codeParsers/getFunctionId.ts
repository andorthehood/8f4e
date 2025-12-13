/**
 * Extracts the identifier provided to the first function instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The function identifier or an empty string when none is found.
 */
export default function getFunctionId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];
		if (instruction === 'function') {
			return args[0] || '';
		}
	}
	return '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getFunctionId', () => {
		it('extracts the identifier argument when a function line exists', () => {
			expect(getFunctionId(['function square int', 'push 2', 'mul', 'functionEnd int'])).toBe('square');
		});

		it('extracts identifier from function with multiple parameters', () => {
			expect(getFunctionId(['function add int int', 'add', 'functionEnd int'])).toBe('add');
		});

		it('returns an empty string when no function instruction is found', () => {
			expect(getFunctionId(['int x', 'int y'])).toBe('');
		});

		it('handles function with no parameters', () => {
			expect(getFunctionId(['function getFortyTwo', 'push 42', 'functionEnd int'])).toBe('getFortyTwo');
		});
	});
}
