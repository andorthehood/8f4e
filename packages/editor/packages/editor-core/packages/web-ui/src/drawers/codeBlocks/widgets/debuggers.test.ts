import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';
import { describe, expect, it, type vi } from 'vitest';
import { createDrawContextMock, createSpriteIdLookupMock } from '../../../__tests__/rendering';
import type { MemoryViews } from '../../../types';
import drawDebuggers from './debuggers';

function createMemoryViews(): MemoryViews {
	return {
		int8: new Int8Array(4),
		int16: new Int16Array(2),
		int32: new Int32Array(1),
		uint8: new Uint8Array(4),
		uint16: new Uint16Array(2),
		float32: new Float32Array(1),
		float64: new Float64Array(0),
	};
}

describe('drawDebuggers', () => {
	it('adds one pair of brackets around compiler stack text', () => {
		const engine = createDrawContextMock();
		const state = createMockState({
			viewport: { vGrid: 8, hGrid: 16 },
			spriteLookups: {
				fontCode: createSpriteIdLookupMock(),
				fontNumbers: createSpriteIdLookupMock(),
			} as never,
		});
		const codeBlock = createMockCodeBlock({
			widgets: {
				debuggers: [
					{
						x: 5,
						y: 7,
						text: '2, 3',
					},
				],
			} as never,
		});

		drawDebuggers(engine, state, codeBlock, createMemoryViews());

		const drawText = (engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText;
		expect(drawText).toHaveBeenNthCalledWith(1, 5, 7, '[', state.spriteLookups?.fontCode);
		expect(drawText).toHaveBeenNthCalledWith(2, 13, 7, '2, 3', state.spriteLookups?.fontNumbers);
		expect(drawText).toHaveBeenNthCalledWith(3, 45, 7, ']', state.spriteLookups?.fontCode);
	});
});
