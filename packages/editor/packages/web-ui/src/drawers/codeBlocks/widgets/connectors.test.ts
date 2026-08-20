import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';
import type { SpriteId } from '@8f4e/sprite-generator';
import { describe, expect, it, type vi } from 'vitest';
import { createDrawContextMock, createSpriteIdLookupMock } from '../../../__tests__/rendering';
import type { MemoryViews } from '../../../types';
import drawConnectors from './connectors';

/** Creates the memory views read by connector widgets. */
function createMemoryViews(float32: number[]): MemoryViews {
	return {
		int8: new Int8Array(0),
		int16: new Int16Array(0),
		int32: new Int32Array(0),
		uint8: new Uint8Array(0),
		uint16: new Uint16Array(0),
		float32: new Float32Array(float32),
		float64: new Float64Array(0),
	};
}

describe('drawConnectors', () => {
	it('uses the validated neutral sprite when a runtime value is non-finite or its scale entry is absent', () => {
		const engine = createDrawContextMock();
		const neutralSpriteId = 10 as SpriteId;
		const output = {
			x: 2,
			y: 3,
			calibratedMax: 1,
			calibratedMin: -1,
			memory: {
				byteAddress: 0,
				wordAlignedAddress: 0,
				wordAlignedSize: 1,
				isInteger: false,
				isFloat64: false,
			},
		} as never;
		const codeBlock = createMockCodeBlock({
			widgets: { outputs: [output], inputs: [] } as never,
		});
		const state = createMockState({
			viewport: { vGrid: 8, hGrid: 16 },
			spriteLookups: {
				feedbackScale: { 0: neutralSpriteId },
				icons: createSpriteIdLookupMock(),
			} as never,
		});

		drawConnectors(engine, state, codeBlock, createMemoryViews([Number.NaN]));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		expect(drawSprite).toHaveBeenCalledWith(2, 3, neutralSpriteId, 24, 16);
	});
});
