import { describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state/testing';

import drawCrossfades from './crossfades';

import type { Engine } from 'glugglug';
import type { Crossfade } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../../types';

function createMemoryViews({ float32 = [] }: { float32?: number[] } = {}): MemoryViews {
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

function createMockEngine(): Engine {
	return {
		startGroup: vi.fn(),
		endGroup: vi.fn(),
		setSpriteLookup: vi.fn(),
		drawSprite: vi.fn(),
	} as unknown as Engine;
}

function createCrossfadeWidget(overrides: Partial<Crossfade> = {}): Crossfade {
	return {
		x: 0,
		y: 0,
		width: 10,
		height: 8,
		leftId: 'dry',
		rightId: 'wet',
		leftWordAddress: 0,
		rightWordAddress: 1,
		handleWidth: 2,
		trackWidth: 8,
		centerX: 4,
		...overrides,
	};
}

describe('drawCrossfades', () => {
	it('draws only the knob when the crossfade is centered', () => {
		const engine = createMockEngine();
		const state = createMockState({
			viewport: {
				vGrid: 2,
				hGrid: 8,
			},
			graphicHelper: { spriteLookups: { fillColors: {} } as never },
		});
		const codeBlock = createMockCodeBlock({
			moduleId: 'test-block',
			widgets: {
				crossfades: [createCrossfadeWidget()],
			} as never,
		});

		drawCrossfades(engine, state, codeBlock, createMemoryViews({ float32: [0, 0] }));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		expect(drawSprite).toHaveBeenCalledWith(0, 0, 'track', 10, 8);
		expect(drawSprite).toHaveBeenCalledWith(4, 0, 'handle', 2, 8);
	});

	it('draws a fill rectangle from the center to the left knob position', () => {
		const engine = createMockEngine();
		const state = createMockState({
			viewport: {
				vGrid: 2,
				hGrid: 8,
			},
			graphicHelper: { spriteLookups: { fillColors: {} } as never },
		});
		const codeBlock = createMockCodeBlock({
			moduleId: 'test-block',
			widgets: {
				crossfades: [createCrossfadeWidget()],
			} as never,
		});

		drawCrossfades(engine, state, codeBlock, createMemoryViews({ float32: [1, 0] }));

		const drawSprite = (engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite;
		expect(drawSprite).toHaveBeenCalledWith(0, 0, 'track', 10, 8);
		expect(drawSprite).toHaveBeenCalledWith(0, 0, 'fill', 6, 8);
		expect(drawSprite).toHaveBeenCalledWith(0, 0, 'handle', 2, 8);
	});
});
