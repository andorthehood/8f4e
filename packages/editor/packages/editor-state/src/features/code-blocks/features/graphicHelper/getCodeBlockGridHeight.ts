import { getGapRowCount } from '~/features/code-blocks/features/graphicHelper/gaps';

/**
 * Computes the grid height required for a code block.
 * Mirrors the extra vertical gaps inserted by the graphic helper.
 */
export default function getCodeBlockGridHeight(code: string[]): number {
	const baseHeight = Math.max(code.length, 1);
	return baseHeight + getGapRowCount(code);
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
