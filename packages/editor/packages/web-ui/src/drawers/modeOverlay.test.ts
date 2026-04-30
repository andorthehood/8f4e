import { describe, expect, it, vi } from 'vitest';
import { createMockState } from '@8f4e/editor-state-testing';

import drawModeOverlay from './modeOverlay';

import type { Engine } from 'glugglug';

function createMockEngine(): Engine {
	return {
		startGroup: vi.fn(),
		endGroup: vi.fn(),
		setSpriteLookup: vi.fn(),
		drawSprite: vi.fn(),
		drawText: vi.fn(),
	} as unknown as Engine;
}

describe('drawModeOverlay', () => {
	it('does not advertise presentation mode when there are no presentation stops', () => {
		const engine = createMockEngine();
		const state = createMockState({
			featureFlags: {
				modeToggling: true,
			},
			editorMode: 'view',
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontDebugInfo: {},
				} as never,
			},
			presentation: {
				canPresent: false,
			},
		});

		drawModeOverlay(engine, state);

		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			state.viewport.vGrid,
			0,
			"You're in view mode, press e to edit"
		);
	});

	it('advertises presentation mode when presentation stops are available', () => {
		const engine = createMockEngine();
		const state = createMockState({
			featureFlags: {
				modeToggling: true,
			},
			editorMode: 'view',
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontDebugInfo: {},
				} as never,
			},
			presentation: {
				canPresent: true,
			},
		});

		drawModeOverlay(engine, state);

		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			state.viewport.vGrid,
			0,
			"You're in view mode, press e to edit or p to present"
		);
	});
});
