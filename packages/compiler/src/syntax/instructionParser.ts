/**
 * Regular expression for parsing instruction lines.
 * Matches an instruction keyword followed by up to 7 arguments, ignoring comments.
 * Format: instruction arg1 arg2 ... arg7 ; optional comment
 */
const instructionParser =
	/^\s*([^\s;]+)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*([^\s;]*)\s*(?:;.*|\s*)/;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('instructionParser', () => {
		it('captures instruction and arguments', () => {
			const match = 'push 1 2 3'.match(instructionParser);
			expect(match?.slice(1, 5)).toEqual(['push', '1', '2', '3']);
		});

		it('ignores trailing comments', () => {
			const match = 'add 1 2 ; comment'.match(instructionParser);
			expect(match?.[1]).toBe('add');
			expect(match?.[2]).toBe('1');
		});
	});
}

export default instructionParser;
