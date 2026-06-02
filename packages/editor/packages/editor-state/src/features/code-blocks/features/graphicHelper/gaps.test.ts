import { describe, expect, it } from 'vitest';
import { createCodeBlockGraphicData } from '../../utils/createCodeBlockGraphicData';
import type { DirectiveDerivedState } from '../directives/registry';
import gaps from './gaps';

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

	it('adds multiple layout contributions on the same display row', async () => {
		const directiveState: DirectiveDerivedState = {
			blockState: { disabled: false, hidden: false, isHome: false, isFavorite: false, opacity: 1 },
			displayState: {},
			displayModel: {
				lines: [
					{ rawRow: 0, text: 'module foo' },
					{ rawRow: 1, text: 'shape sharedState' },
					{ rawRow: 2, text: 'moduleEnd' },
				],
				displayRowToRawRow: [0, 1, 2],
				rawRowToDisplayRow: [0, 1, 2],
				isCollapsed: false,
			},
			layoutContributions: [
				{ rawRow: 1, rows: 2 },
				{ rawRow: 1, rows: 3 },
			],
			widgets: [],
		};
		const graphicData = createCodeBlockGraphicData({
			code: ['module foo', 'shape sharedState', 'moduleEnd'],
			codeToRender: [[1], [2], [3]],
			codeColors: [[undefined], [undefined], [undefined]],
		});

		gaps(graphicData, directiveState);

		expect(graphicData.gaps.get(1)).toEqual({ size: 5 });
		expect(graphicData.codeToRender).toHaveLength(8);
		expect(graphicData.codeColors).toHaveLength(8);
	});

	it('adds error gaps to layout contributions on the same display row', async () => {
		const directiveState: DirectiveDerivedState = {
			blockState: { disabled: false, hidden: false, isHome: false, isFavorite: false, opacity: 1 },
			displayState: {},
			displayModel: {
				lines: [
					{ rawRow: 0, text: 'module foo' },
					{ rawRow: 1, text: 'shape sharedState' },
					{ rawRow: 2, text: 'moduleEnd' },
				],
				displayRowToRawRow: [0, 1, 2],
				rawRowToDisplayRow: [0, 1, 2],
				isCollapsed: false,
			},
			layoutContributions: [{ rawRow: 1, rows: 2 }],
			widgets: [],
		};
		const graphicData = createCodeBlockGraphicData({
			code: ['module foo', 'shape sharedState', 'moduleEnd'],
			codeToRender: [[1], [2], [3]],
			codeColors: [[undefined], [undefined], [undefined]],
			widgets: {
				blockHighlights: [],
				inputs: [],
				outputs: [],
				debuggers: [],
				switches: [],
				buttons: [],
				sliders: [],
				crossfades: [],
				pianoKeyboards: [],
				arrayPlotters: [],
				arrayBars: [],
				arrayMeters: [],
				arrayWaves: [],
				infoPanels: [],
				errorMessages: [{ message: ['Error', 'detail', 'more'], x: 0, y: 0, lineNumber: 1 }],
			},
		});

		gaps(graphicData, directiveState);

		expect(graphicData.gaps.get(1)).toEqual({ size: 5 });
		expect(graphicData.codeToRender).toHaveLength(8);
		expect(graphicData.codeColors).toHaveLength(8);
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
				crossfades: [],
				pianoKeyboards: [],
				arrayPlotters: [],
				arrayBars: [],
				arrayMeters: [],
				arrayWaves: [],
				infoPanels: [],
				errorMessages: [{ message: ['Error'], x: 0, y: 0, lineNumber: 2 }],
			},
		});

		gaps(graphicData, directiveState);

		expect(graphicData.gaps.size).toBe(0);
		expect(graphicData.codeToRender).toHaveLength(2);
		expect(graphicData.codeColors).toHaveLength(2);
	});
});
