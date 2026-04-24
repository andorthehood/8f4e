import { describe, expect, it, vi } from 'vitest';
import { createMockState } from '@8f4e/editor-state/testing';

import drawRecordingMatte from './recordingMatte';

import type { Engine } from 'glugglug';

function createMockEngine(): Engine {
	return {
		setSpriteLookup: vi.fn(),
		drawSprite: vi.fn(),
	} as unknown as Engine;
}

describe('drawRecordingMatte', () => {
	it('does not draw until sprite lookups are available', () => {
		const engine = createMockEngine();
		const state = createMockState();

		drawRecordingMatte(engine, state);

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).not.toHaveBeenCalled();
	});

	it('draws a colorable matte around the viewport', () => {
		const engine = createMockEngine();
		const fillColors = {};
		const state = createMockState({
			editorMode: 'view',
			viewport: {
				width: 640,
				height: 480,
				vGrid: 8,
				hGrid: 16,
			},
			graphicHelper: {
				spriteLookups: {
					fillColors,
				} as never,
			},
		});

		drawRecordingMatte(engine, state);

		expect((engine as unknown as { setSpriteLookup: ReturnType<typeof vi.fn> }).setSpriteLookup).toHaveBeenCalledWith(
			fillColors
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			1,
			0,
			0,
			'recordingMatte',
			640,
			32
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			2,
			0,
			448,
			'recordingMatte',
			640,
			32
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			3,
			608,
			32,
			'recordingMatte',
			32,
			416
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			4,
			0,
			32,
			'recordingMatte',
			32,
			416
		);
	});

	it('clamps matte strips so they do not overlap in small viewports', () => {
		const engine = createMockEngine();
		const state = createMockState({
			viewport: {
				width: 40,
				height: 40,
				vGrid: 8,
				hGrid: 16,
			},
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
				} as never,
			},
		});

		drawRecordingMatte(engine, state);

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			1,
			0,
			0,
			'recordingMatte',
			40,
			20
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenNthCalledWith(
			2,
			0,
			20,
			'recordingMatte',
			40,
			20
		);
		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledTimes(2);
	});
});
