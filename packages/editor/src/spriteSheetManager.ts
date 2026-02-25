import generateSprite from '@8f4e/sprite-generator';

import { updateStateWithSpriteData } from './updateStateWithSpriteData';

import type { State } from '@8f4e/editor-state';
import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from './events';
import type { SpriteData } from '@8f4e/web-ui';

type SpriteSheetView = {
	loadSpriteSheet: (spriteData: SpriteData) => void;
	clearCache: () => void;
};

/**
 * Keeps the sprite sheet and render cache in sync with editor state changes.
 */
export function createSpriteSheetManager(
	store: StateManager<State>,
	view: SpriteSheetView,
	events: EventDispatcher
): void {
	const state = store.getState();
	const rerenderSpriteSheet = async () => {
		const spriteData = await generateSprite({
			font: state.compiledEditorConfig.font || '8x16',
			colorScheme: state.colorScheme,
		});

		view.loadSpriteSheet(spriteData);

		// Update state with new sprite data
		updateStateWithSpriteData(state, spriteData);

		view.clearCache();
		events.dispatch('spriteSheetRerendered');
	};

	store.subscribe('colorScheme', rerenderSpriteSheet);
	store.subscribe('compiledEditorConfig.font', rerenderSpriteSheet);
}
