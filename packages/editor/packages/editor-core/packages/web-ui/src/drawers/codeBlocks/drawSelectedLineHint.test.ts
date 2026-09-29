import { createMockState } from '@8f4e/editor-state-testing';
import { describe, expect, it } from 'vitest';
import { getTooltipAnimationOffsetX } from './drawSelectedLineHint';

describe('selected line tooltip animation', () => {
	it('eases the tooltip into place from its initial left offset', () => {
		const state = createMockState({
			tooltip: {
				animation: {
					startedAt: 1_000,
				},
			},
		});

		expect(getTooltipAnimationOffsetX(state, 1_000)).toBe(-16);
		expect(getTooltipAnimationOffsetX(state, 1_090)).toBe(-2);
		expect(getTooltipAnimationOffsetX(state, 1_180)).toBe(0);
		expect(getTooltipAnimationOffsetX(state, 1_200)).toBe(0);
	});

	it('draws in the final position when no animation is active', () => {
		const state = createMockState();

		expect(getTooltipAnimationOffsetX(state, 1_000)).toBe(0);
	});
});
