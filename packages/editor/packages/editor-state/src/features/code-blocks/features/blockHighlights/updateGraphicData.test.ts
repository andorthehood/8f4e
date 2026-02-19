import { describe, it, expect } from 'vitest';

import updateBlockHighlightsGraphicData from './updateGraphicData';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

describe('updateBlockHighlightsGraphicData', () => {
	it('highlights only lines between block start and end instructions', () => {
		const graphicData = createMockCodeBlock({
			code: ['if condition', 'add', 'store', 'ifEnd'],
			width: 200,
			lineNumberColumnWidth: 1,
			gaps: new Map(),
		});
		const state = createMockState({
			viewport: {
				vGrid: 10,
				hGrid: 20,
			},
		});

		updateBlockHighlightsGraphicData(graphicData, state);

		expect(graphicData.extras.blockHighlights).toEqual([
			{
				x: 30,
				y: 20,
				width: 170,
				height: 40,
				color: 'codeBlockHighlightLevel1',
			},
		]);
	});

	it('does not render a highlight when no lines exist between block boundaries', () => {
		const graphicData = createMockCodeBlock({
			code: ['if condition', 'ifEnd'],
		});
		const state = createMockState();

		updateBlockHighlightsGraphicData(graphicData, state);

		expect(graphicData.extras.blockHighlights).toEqual([]);
	});
});
