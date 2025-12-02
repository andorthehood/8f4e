import type { CodeBlockGraphicData } from '../../types';

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
