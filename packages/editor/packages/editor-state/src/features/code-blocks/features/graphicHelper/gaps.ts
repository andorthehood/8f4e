import { createCodeBlockGraphicData } from '../../utils/createCodeBlockGraphicData';
import { type DirectiveDerivedState } from '../directives/registry';

import type { CodeBlockGraphicData } from '~/types';

function getDisplayRow(rawRow: number, directiveState: DirectiveDerivedState): number | undefined {
	return directiveState.displayModel.rawRowToDisplayRow[rawRow];
}

export default function gaps(graphicData: CodeBlockGraphicData, directiveState: DirectiveDerivedState) {
	graphicData.gaps.clear();

	graphicData.widgets.errorMessages.forEach(error => {
		const displayRow = getDisplayRow(error.lineNumber, directiveState);
		if (displayRow !== undefined) {
			graphicData.gaps.set(displayRow, { size: error.message.length });
		}
	});

	directiveState.layoutContributions.forEach(contribution => {
		const displayRow = getDisplayRow(contribution.rawRow, directiveState);
		if (displayRow !== undefined) {
			graphicData.gaps.set(displayRow, { size: contribution.rows });
		}
	});

	const gaps = Array.from(graphicData.gaps).sort(([a], [b]) => {
		return b - a;
	});

	gaps.forEach(([row, gap]) => {
		graphicData.codeToRender.splice(row + 1, 0, ...new Array(gap.size).fill(' '));
		graphicData.codeColors.splice(row + 1, 0, ...new Array(gap.size).fill([]));
	});
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('gaps', () => {
		it('inserts directive gaps using display rows', async () => {
			const directiveState: DirectiveDerivedState = {
				blockState: { disabled: false, hidden: false, isHome: false, isFavorite: false, opacity: 1 },
				displayState: {},
				displayModel: {
					lines: [
						{ rawRow: 0, text: 'module foo' },
						{ rawRow: 1, text: '; @plot buffer' },
						{ rawRow: 3, text: 'moduleEnd' },
					],
					displayRowToRawRow: [0, 1, 3],
					rawRowToDisplayRow: [0, 1, undefined, 2],
					isCollapsed: false,
				},
				layoutContributions: [{ rawRow: 1, rows: 8 }],
				widgets: [],
			};
			const graphicData = createCodeBlockGraphicData({
				code: ['module foo', '; @plot buffer', 'push 1', 'moduleEnd'],
				codeToRender: [[1], [2], [3]],
				codeColors: [[undefined], [undefined], [undefined]],
			});

			gaps(graphicData, directiveState);

			expect(graphicData.gaps.get(1)).toEqual({ size: 8 });
			expect(graphicData.codeToRender).toHaveLength(11);
			expect(graphicData.codeColors).toHaveLength(11);
		});

		it('skips gaps for raw rows hidden from the display model', async () => {
			const directiveState: DirectiveDerivedState = {
				blockState: { disabled: false, hidden: false, isHome: false, isFavorite: false, opacity: 1 },
				displayState: {},
				displayModel: {
					lines: [
						{ rawRow: 0, text: 'module foo' },
						{ rawRow: 3, text: 'moduleEnd' },
					],
					displayRowToRawRow: [0, 3],
					rawRowToDisplayRow: [0, undefined, undefined, 1],
					isCollapsed: true,
				},
				layoutContributions: [{ rawRow: 1, rows: 8 }],
				widgets: [],
			};
			const graphicData = createCodeBlockGraphicData({
				code: ['module foo', '; @plot buffer', 'push 1', 'moduleEnd'],
				codeToRender: [[1], [2]],
				codeColors: [[undefined], [undefined]],
				widgets: {
					blockHighlights: [],
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons: [],
					sliders: [],
					pianoKeyboards: [],
					arrayPlotters: [],
					arrayMeters: [],
					arrayWaves: [],
					errorMessages: [{ message: ['Error'], x: 0, y: 0, lineNumber: 2 }],
				},
			});

			gaps(graphicData, directiveState);

			expect(graphicData.gaps.size).toBe(0);
			expect(graphicData.codeToRender).toHaveLength(2);
			expect(graphicData.codeColors).toHaveLength(2);
		});
	});
}
