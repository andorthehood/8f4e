/**
 * Finds the last line index in a code block that begins with a memory instruction.
 * @param code - Code block represented as an array of lines.
 * @returns Index of the last memory instruction or -1 if none exists.
 */
export default function getLastMemoryInstructionLine(code: string[]) {
	return code.findLastIndex(line => /^\s*memory/.test(line));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getLastMemoryInstructionLine', () => {
		it('returns the last index that starts with memory', () => {
			const code = ['memory 1', 'other', 'memory 2', 'end'];
			expect(getLastMemoryInstructionLine(code)).toBe(2);
		});

		it('returns -1 when no memory instruction exists', () => {
			expect(getLastMemoryInstructionLine(['int x', 'int y'])).toBe(-1);
		});
	});
}
