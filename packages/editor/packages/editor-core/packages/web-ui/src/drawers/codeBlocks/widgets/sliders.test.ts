import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';
import type { Slider } from '@8f4e/editor-state-types';
import { describe, expect, it, type vi } from 'vitest';
import { createDrawContextMock, createSpriteIdLookupMock } from '../../../__tests__/rendering';
import type { MemoryViews } from '../../../types';
import drawSliders from './sliders';

const slider: Slider = {
	moduleId: 'test',
	x: 10,
	y: 20,
	width: 32,
	height: 16,
	id: 'gain',
	allocationUnitAddress: 0,
	byteAddress: 0,
	isInteger: false,
	isFloat64: false,
	min: 0,
	max: 1,
};

function createMemoryViews(value: number): MemoryViews {
	return {
		int8: new Int8Array(0),
		int16: new Int16Array(0),
		int32: new Int32Array(0),
		uint8: new Uint8Array(0),
		uint16: new Uint16Array(0),
		float32: new Float32Array([value]),
		float64: new Float64Array(0),
	};
}

describe('drawSliders', () => {
	it('draws a colon over the slider handle', () => {
		const engine = createDrawContextMock();
		const state = createMockState({
			viewport: { vGrid: 8, hGrid: 16 },
			spriteLookups: {
				fillColors: createSpriteIdLookupMock(),
				fontNumbers: createSpriteIdLookupMock(),
			} as never,
		});
		const codeBlock = createMockCodeBlock({
			widgets: { sliders: [slider] } as never,
		});

		drawSliders(engine, state, codeBlock, createMemoryViews(0.5));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		const drawText = (engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText;
		expect(drawSprite.mock.calls).toEqual([
			[0, 0, 'track', 32, 16],
			[0, 0, 'fill', 20, 16],
			[12, 0, 'handle', 8, 16],
		]);
		expect(drawText).toHaveBeenCalledWith(12, 0, ':', state.spriteLookups?.fontNumbers);
	});
});
