/**
 * Extracts the identifier provided to the first module instruction within a block of code.
 * @param code - Code block represented as an array of lines.
 * @returns The module identifier or an empty string when none is found.
 */
export default function getModuleId(code: string[]) {
	for (let i = 0; i < code.length; i++) {
		const [, instruction, ...args] = code[i].match(/\s*(\S+)\s*(\S*)\s*(\S*)\s*(\S*)/) || [];
		if (instruction === 'module') {
			return args[0] || '';
		}
	}
	return '';
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getModuleId', () => {
		it('extracts the identifier argument when a module line exists', () => {
			expect(getModuleId(['module test', 'int x', 'moduleEnd'])).toBe('test');
		});

		it('returns an empty string when no module instruction is found', () => {
			expect(getModuleId(['int x', 'int y'])).toBe('');
		});
	});
}
