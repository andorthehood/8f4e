import type { CodeBlockGraphicData } from '../../types';

/**
 * Calculates the physical row index by adding the size of every gap that starts before the logical row.
 * Gaps are produced by `features/code-blocks/gaps.ts` to insert additional blank rows after a line
 * whenever a decoration (plot/piano visualizers or compilation errors) needs vertical space in the
 * rendered block. Each entry stores how many extra rows were spliced into `codeToRender` after that
 * logical line, so downstream consumers must translate logical line numbers into physical rows before
 * turning them into pixel coordinates.
 * @param row Logical row within the editor before accounting for the inserted gap rows.
 * @param gaps Gap metadata keyed by logical row whose size indicates the number of additional rows inserted.
 * @returns The adjusted physical row that includes the cumulative gap offsets.
 */
export default function gapCalculator(row: number, gaps: CodeBlockGraphicData['gaps']) {
	let physicalRowCounter = row;
	for (const [gapStartLine, { size }] of gaps) {
		if (row > gapStartLine) {
			physicalRowCounter += size;
		}
	}
	return physicalRowCounter;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('gapCalculator', () => {
		it('returns the same row when there are no preceding gaps', () => {
			const gaps: CodeBlockGraphicData['gaps'] = new Map([[5, { size: 2 }]]);
			expect(gapCalculator(3, gaps)).toBe(3);
		});

		it('adds the size of each gap that starts before the row', () => {
			const gaps: CodeBlockGraphicData['gaps'] = new Map([
				[1, { size: 2 }],
				[4, { size: 1 }],
			]);
			expect(gapCalculator(5, gaps)).toBe(8);
		});
	});
}
