import { createMockState } from '@8f4e/editor-state-testing';
import { describe, expect, it } from 'vitest';
import { getTooltipAnimationOffset } from './drawSelectedLineHint';

describe('selected line tooltip animation', () => {
	it('follows a damped elliptical path from the left into its final position', () => {
		const state = createMockState({
			tooltip: {
				animation: {
					startedAt: 1_000,
				},
			},
		});

		expect(getTooltipAnimationOffset(state, 1_000)).toEqual({ x: -16, y: 0 });
		expect(getTooltipAnimationOffset(state, 1_100)).toEqual({ x: 0, y: -6 });
		expect(getTooltipAnimationOffset(state, 1_200)).toEqual({ x: 9, y: 0 });
		expect(getTooltipAnimationOffset(state, 1_300)).toEqual({ x: 0, y: 3 });
		expect(getTooltipAnimationOffset(state, 1_400)).toEqual({ x: -3, y: 0 });
		expect(getTooltipAnimationOffset(state, 1_600)).toEqual({ x: 0, y: 0 });
		expect(getTooltipAnimationOffset(state, 1_700)).toEqual({ x: 0, y: 0 });
	});

	it('draws in the final position when no animation is active', () => {
		const state = createMockState();

		expect(getTooltipAnimationOffset(state, 1_000)).toEqual({ x: 0, y: 0 });
	});
});
