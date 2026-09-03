import { createMockState } from '@8f4e/editor-state-testing';
import { describe, expect, it, type vi } from 'vitest';
import { createDrawContextMock, createSpriteIdLookupMock } from '../__tests__/rendering';
import drawDialog from './dialog';

describe('drawDialog', () => {
	it('draws a highlighted dialog button', () => {
		const engine = createDrawContextMock();
		const state = createMockState({
			dialogStack: [{ id: 'permission', title: 'Permission', text: 'Allow audio?', buttons: [] }],
			dialog: {
				id: 'permission',
				title: 'Permission',
				text: 'Allow audio?',
				wrappedText: ['Allow audio?'],
				buttons: [
					{
						title: 'Grant',
						action: 'grantAudioPermission',
						x: 448,
						y: 80,
						width: 56,
						height: 16,
					},
				],
				highlightedButton: 0,
				x: 64,
				y: 320,
				width: 512,
				height: 112,
			},
			viewport: {
				width: 640,
				height: 768,
				vGrid: 8,
				hGrid: 16,
			},
			spriteLookups: {
				fillColors: createSpriteIdLookupMock(),
				fontCode: createSpriteIdLookupMock(),
				fontDialogTitle: createSpriteIdLookupMock(),
				fontDialogText: createSpriteIdLookupMock(),
				fontMenuItemText: createSpriteIdLookupMock(),
				fontMenuItemTextHighlighted: createSpriteIdLookupMock(),
			} as never,
		});

		drawDialog(engine, state);

		expect((engine as unknown as { drawSprite: ReturnType<typeof vi.fn> }).drawSprite).toHaveBeenCalledWith(
			448,
			80,
			'menuItemBackgroundHighlighted',
			56,
			16
		);
		expect((engine as unknown as { drawText: ReturnType<typeof vi.fn> }).drawText).toHaveBeenCalledWith(
			448,
			80,
			'[Grant]',
			state.spriteLookups?.fontMenuItemTextHighlighted
		);
	});
});
