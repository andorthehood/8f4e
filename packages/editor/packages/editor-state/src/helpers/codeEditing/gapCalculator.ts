import type { CodeBlockGraphicData } from '../../types';

export function gapCalculator(row: number, gaps: CodeBlockGraphicData['gaps']) {
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
