/**
 * Parses pointer depth from an instruction string (e.g., "int**" returns 2).
 */
export default function getPointerDepth(instruction: string): number {
	const matches = instruction.match(/\*+$/);
	return matches ? matches[0].length : 0;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getPointerDepth', () => {
		it('counts trailing pointer markers', () => {
			expect(getPointerDepth('int')).toBe(0);
			expect(getPointerDepth('int*')).toBe(1);
			expect(getPointerDepth('float**')).toBe(2);
		});

		it('ignores non-trailing asterisks', () => {
			expect(getPointerDepth('in*t')).toBe(0);
		});
	});
}
