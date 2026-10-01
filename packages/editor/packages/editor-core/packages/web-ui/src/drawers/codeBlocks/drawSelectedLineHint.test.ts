import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';
import { describe, expect, it, type vi } from 'vitest';
import { createDrawContextMock, createSpriteIdLookupMock } from '../../__tests__/rendering';
import type { MemoryViews } from '../../types';
import drawSelectedLineHint, { getTooltipAnimationOffset } from './drawSelectedLineHint';

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

	it('renders an invalid marker instead of dereferencing a negative pointer', () => {
		const codeBlock = createMockCodeBlock();
		const highlightFont = createSpriteIdLookupMock();
		const state = createMockState({
			compiler: {
				memoryPlan: {
					modules: {
						test: {
							memory: {
								pointer: {
									wordAlignedAddress: 0,
								},
							},
						},
					},
				},
			} as never,
			featureFlags: { codeLineSelection: true },
			codeBlockRendering: { selectedCodeBlock: codeBlock },
			spriteLookups: {
				fillColors: { tooltipBackground: 'tooltipBackground' },
				fontTooltipHighlight: highlightFont,
			} as never,
			tooltip: {
				lineCount: 1,
				layout: { width: 80, height: 16, x: 0, y: 0, lineX: 0 },
				highlights: [],
				characters: [],
				colors: [],
				liveValues: [
					{
						x: 8,
						y: 16,
						source: {
							kind: 'memoryDereference',
							moduleId: 'test',
							memoryId: 'pointer',
							format: { elementWordSize: 1, isInteger: true, isUnsigned: true },
						},
						color: highlightFont,
					},
				],
			},
		});
		const buffer = new ArrayBuffer(4);
		const memoryViews: MemoryViews = {
			int8: new Int8Array(buffer),
			int16: new Int16Array(buffer),
			int32: new Int32Array(buffer),
			uint8: new Uint8Array(buffer),
			uint16: new Uint16Array(buffer),
			float32: new Float32Array(buffer),
			float64: new Float64Array(0),
		};
		memoryViews.int32[0] = -1;
		const engine = createDrawContextMock();

		drawSelectedLineHint(engine, state, codeBlock, memoryViews);

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			8,
			16,
			'?'.charCodeAt(0)
		);
	});
});
