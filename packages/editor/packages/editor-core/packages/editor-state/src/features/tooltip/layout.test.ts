import { describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createEmptyTooltipState, getTooltipState } from './layout';
import type { SelectedLineTooltipContent } from './types';

const content: SelectedLineTooltipContent = {
	text: ['before [int=1]', 'after: [int=1]'],
	characters: [],
	colors: [],
	lineCount: 2,
	widthChars: 14,
	highlightTargets: [],
	liveValueTargets: [],
};

describe('tooltip layout', () => {
	it('starts animation for a new selected line and preserves it across content refreshes', () => {
		const selectedCodeBlock = createMockCodeBlock({ creationIndex: 4 });
		const state = createMockState({
			codeBlockRendering: { selectedCodeBlock },
		});

		state.tooltip = getTooltipState(content, state, selectedCodeBlock, 100);
		expect(state.tooltip.animation.startedAt).toBe(100);

		state.tooltip = getTooltipState(content, state, selectedCodeBlock, 200);
		expect(state.tooltip.animation.startedAt).toBe(100);

		selectedCodeBlock.cursor.row = 1;
		state.tooltip = getTooltipState(content, state, selectedCodeBlock, 300);
		expect(state.tooltip.animation.startedAt).toBe(300);
	});

	it('restarts animation when content appears for the current target', () => {
		const selectedCodeBlock = createMockCodeBlock({ creationIndex: 4 });
		const state = createMockState({
			codeBlockRendering: { selectedCodeBlock },
		});

		state.tooltip = getTooltipState(content, state, selectedCodeBlock, 100);
		state.tooltip = createEmptyTooltipState();
		state.tooltip = getTooltipState(content, state, selectedCodeBlock, 200);

		expect(state.tooltip.animation.startedAt).toBe(200);
	});
});
