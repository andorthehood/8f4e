import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';
import type { ArrayWave } from '@8f4e/editor-state-types';
import { describe, expect, it, type vi } from 'vitest';
import { createDrawContextMock, createSpriteIdLookupMock } from '../../../__tests__/rendering';
import type { MemoryViews } from '../../../types';
import drawWaves from './waves';

function createMemoryViews({ int8 = [], int32 = [] }: { int8?: number[]; int32?: number[] } = {}): MemoryViews {
	return {
		int8: new Int8Array(int8),
		int16: new Int16Array(0),
		int32: new Int32Array(int32),
		uint8: new Uint8Array(0),
		uint16: new Uint16Array(0),
		float32: new Float32Array(0),
		float64: new Float64Array(0),
	};
}

function createWaveWidget(overrides: Partial<ArrayWave> = {}): ArrayWave {
	return {
		x: 2,
		y: 3,
		width: 8,
		height: 8,
		startAddress: {
			showAddress: true,
			showEndAddress: false,
			bufferPointer: 0,
			displayFormat: 'decimal',
			memory: { byteAddress: 0, wordAlignedAddress: 0, wordAlignedSize: 4 },
		} as never,
		elementByteSize: 1,
		inverseElementByteSize: 1,
		baseSampleShift: 0,
		length: 4,
		valueType: 'int8',
		minValue: -128,
		maxValue: 127,
		inverseValueRange: 1 / 255,
		...overrides,
	};
}

describe('drawWaves', () => {
	it('draws the waveform background before the waveform', () => {
		const engine = createDrawContextMock();
		const state = createMockState({
			spriteLookups: { fillColors: createSpriteIdLookupMock() } as never,
			viewport: { vGrid: 4 },
		});
		const codeBlock = createMockCodeBlock({
			widgets: { arrayWaves: [createWaveWidget()] } as never,
		});

		drawWaves(engine, state, codeBlock, createMemoryViews({ int8: [-128, 0, 127, 0] }));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		expect(drawSprite).toHaveBeenNthCalledWith(1, 0, 0, 'waveformBackground', 8, 8);
		expect(drawSprite).toHaveBeenNthCalledWith(2, 0, 7, 'waveform', 2, 1);
	});

	it('draws the playhead over the waveform background', () => {
		const engine = createDrawContextMock();
		const state = createMockState({
			spriteLookups: { fillColors: createSpriteIdLookupMock() } as never,
			viewport: { vGrid: 4 },
		});
		const codeBlock = createMockCodeBlock({
			widgets: {
				arrayWaves: [
					createWaveWidget({
						pointer: {
							showAddress: false,
							showEndAddress: false,
							bufferPointer: 0,
							displayFormat: 'decimal',
							memory: { byteAddress: 0, wordAlignedAddress: 0, wordAlignedSize: 1 },
						} as never,
					}),
				],
			} as never,
		});

		drawWaves(engine, state, codeBlock, createMemoryViews({ int8: [-128, 0, 127, 0], int32: [2] }));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		expect(drawSprite).toHaveBeenLastCalledWith(4, 0, 'scanLine', 2, 8);
	});
});
