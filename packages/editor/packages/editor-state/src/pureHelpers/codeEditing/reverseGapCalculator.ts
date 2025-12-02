import type { CodeBlockGraphicData } from '../../types';

/**
 * Converts a physical row index (which includes gap rows inserted for decorations) back into a logical row.
 * The `gaps` map stores how many extra rows were spliced after each logical line so plots, pianos, and error
 * callouts have dedicated vertical space; when translating from screen coordinates we need to subtract those
 * offsets to recover the original code line.
 * @param physicalRow Row index taken from rendered grid coordinates.
 * @param gaps Gap metadata keyed by logical row identifying how many physical rows were inserted after it.
 * @returns A non-negative logical row with gap offsets removed.
 */
export function reverseGapCalculator(physicalRow: number, gaps: CodeBlockGraphicData['gaps']) {
	let startLineOffset = 0;
	for (const [gapStartLine, { size }] of gaps) {
		if (physicalRow > gapStartLine + startLineOffset) {
			startLineOffset += size;
		}
	}

	return Math.max(physicalRow - startLineOffset, 0);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('reverseGapCalculator', () => {
		it('returns the physical row when no gap applies', () => {
			const gaps: CodeBlockGraphicData['gaps'] = new Map([[5, { size: 3 }]]);
			expect(reverseGapCalculator(2, gaps)).toBe(2);
		});

		it('subtracts gap sizes that affect the row', () => {
			const gaps: CodeBlockGraphicData['gaps'] = new Map([
				[1, { size: 2 }],
				[4, { size: 3 }],
			]);
			expect(reverseGapCalculator(10, gaps)).toBe(5);
		});

		it('never returns a negative row', () => {
			const gaps: CodeBlockGraphicData['gaps'] = new Map([[0, { size: 10 }]]);
			expect(reverseGapCalculator(5, gaps)).toBe(0);
		});
	});
}
