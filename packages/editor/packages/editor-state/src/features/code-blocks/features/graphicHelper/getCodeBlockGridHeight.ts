import { instructionParser } from '@8f4e/compiler/syntax';

const GAP_SIZES: Record<string, number> = {
	plot: 8,
	scan: 2,
	slider: 2,
	piano: 6,
};

/**
 * Computes the grid height required for a code block.
 * Mirrors the extra vertical gaps inserted by the graphic helper.
 */
export default function getCodeBlockGridHeight(code: string[]): number {
	const baseHeight = Math.max(code.length, 1);
	let gapRows = 0;

	for (const line of code) {
		const [, instruction, directive] = (line.match(instructionParser) ?? []) as [never, string, string];
		if (instruction === '#' && directive && GAP_SIZES[directive]) {
			gapRows += GAP_SIZES[directive];
		}
	}

	return baseHeight + gapRows;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('getCodeBlockGridHeight', () => {
		it('returns at least one row for empty code', () => {
			expect(getCodeBlockGridHeight([])).toBe(1);
		});

		it('adds gap rows for plot/scan/slider/piano directives', () => {
			const code = ['module test', '# plot', '# scan', '# slider', '# piano', 'moduleEnd'];
			// base: 6 lines, gaps: 8 + 2 + 2 + 6 = 18
			expect(getCodeBlockGridHeight(code)).toBe(24);
		});
	});
}
