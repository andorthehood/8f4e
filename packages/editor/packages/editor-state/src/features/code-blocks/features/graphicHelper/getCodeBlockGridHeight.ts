/**
 * Computes the grid height required for a code block, accounting for visual gaps
 * inserted by directives like @plot, @scan, @slider, and @piano.
 * Matches the sizing logic used by the gaps helper and graphicHelper effect.
 *
 * @param code - Code block represented as an array of lines
 * @returns The grid height in grid units (number of rendered lines including gap rows)
 */
export default function getCodeBlockGridHeight(code: string[]): number {
	let gapTotal = 0;

	for (const line of code) {
		const commentMatch = line.match(/^\s*;\s*@(\w+)/);
		if (commentMatch) {
			const directive = commentMatch[1];
			if (directive === 'plot') gapTotal += 8;
			else if (directive === 'scan') gapTotal += 2;
			else if (directive === 'slider') gapTotal += 2;
			else if (directive === 'piano') gapTotal += 6;
		}
	}

	return code.length + gapTotal;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getCodeBlockGridHeight', () => {
		it('returns code.length when there are no gap directives', () => {
			const code = ['module test', 'float x', 'moduleEnd'];
			expect(getCodeBlockGridHeight(code)).toBe(3);
		});

		it('handles empty code array', () => {
			expect(getCodeBlockGridHeight([])).toBe(0);
		});

		it('adds 8 rows for a @plot directive', () => {
			const code = ['module test', '; @plot mem 0 44', 'moduleEnd'];
			expect(getCodeBlockGridHeight(code)).toBe(3 + 8);
		});

		it('adds 2 rows for a @scan directive', () => {
			const code = ['module test', '; @scan mem 0 44', 'moduleEnd'];
			expect(getCodeBlockGridHeight(code)).toBe(3 + 2);
		});

		it('adds 2 rows for a @slider directive', () => {
			const code = ['module test', '; @slider x 0 1', 'moduleEnd'];
			expect(getCodeBlockGridHeight(code)).toBe(3 + 2);
		});

		it('adds 6 rows for a @piano directive', () => {
			const code = ['module test', '; @piano keys 0 1', 'moduleEnd'];
			expect(getCodeBlockGridHeight(code)).toBe(3 + 6);
		});

		it('accumulates gap rows for multiple gap directives', () => {
			const code = ['module test', '; @plot mem 0 44', '; @scan mem2 0 22', 'moduleEnd'];
			expect(getCodeBlockGridHeight(code)).toBe(4 + 8 + 2);
		});
	});
}
