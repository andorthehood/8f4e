import { createMockState } from '@8f4e/editor-state-testing';
import { describe, expect, it, type vi } from 'vitest';
import { createDrawContextMock, createSpriteIdLookupMock } from '../__tests__/rendering';
import type { DrawContext as Engine } from '../drawContext';
import drawModeOverlay from './modeOverlay';

function createMockEngine(): Engine {
	return createDrawContextMock();
}

describe('drawModeOverlay', () => {
	it('does not advertise presentation mode when there are no presentation stops', () => {
		const engine = createMockEngine();
		const state = createMockState({
			featureFlags: {
				modeToggling: true,
			},
			editorMode: 'view',
			spriteLookups: {
				fillColors: createSpriteIdLookupMock(),
				fontDebugInfo: createSpriteIdLookupMock(),
			} as never,
			presentation: {
				canPresent: false,
			},
		});

		drawModeOverlay(engine, state);

		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			state.viewport.vGrid,
			0,
			"You're in view mode, press e to edit",
			state.spriteLookups?.fontDebugInfo
		);
	});

	it('advertises presentation mode when presentation stops are available', () => {
		const engine = createMockEngine();
		const state = createMockState({
			featureFlags: {
				modeToggling: true,
			},
			editorMode: 'view',
			spriteLookups: {
				fillColors: createSpriteIdLookupMock(),
				fontDebugInfo: createSpriteIdLookupMock(),
			} as never,
			presentation: {
				canPresent: true,
			},
		});

		drawModeOverlay(engine, state);

		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			state.viewport.vGrid,
			0,
			"You're in view mode, press e to edit or p to present",
			state.spriteLookups?.fontDebugInfo
		);
	});

	it('does not draw when the mode overlay feature is disabled', () => {
		const engine = createMockEngine();
		const state = createMockState({
			featureFlags: {
				modeOverlay: false,
				modeToggling: true,
			},
			editorMode: 'view',
			spriteLookups: {
				fillColors: createSpriteIdLookupMock(),
				fontDebugInfo: createSpriteIdLookupMock(),
			} as never,
		});

		drawModeOverlay(engine, state);

		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).not.toHaveBeenCalled();
	});
});
