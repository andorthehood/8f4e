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

		it('ignores trailing semicolon comments', () => {
			const match = 'add 1 2 ; comment'.match(instructionParser);
			expect(match?.[1]).toBe('add');
			expect(match?.[2]).toBe('1');
		});

		it('treats hash as part of argument, not a comment', () => {
			const match = 'add 1 2 # comment'.match(instructionParser);
			expect(match?.[1]).toBe('add');
			expect(match?.[2]).toBe('1');
			expect(match?.[3]).toBe('2');
			expect(match?.[4]).toBe('#');
			expect(match?.[5]).toBe('comment');
		});
	});
}

export default instructionParser;
