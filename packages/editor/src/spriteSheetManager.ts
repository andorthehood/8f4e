import type { State } from '@8f4e/editor-state';
import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from './events';
import type { SpriteData } from '@8f4e/web-ui';

type SpriteSheetView = {
	reloadSpriteSheet: () => SpriteData;
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
	const rerenderSpriteSheet = () => {
		const spriteData = view.reloadSpriteSheet();

		// Update state with new sprite data
		// Note: hGrid represents horizontal grid lines (vertical spacing = character height)
		//       vGrid represents vertical grid lines (horizontal spacing = character width)
		const state = store.getState();
		state.graphicHelper.spriteLookups = spriteData.spriteLookups;
		state.graphicHelper.viewport.hGrid = spriteData.characterHeight;
		state.graphicHelper.viewport.vGrid = spriteData.characterWidth;

		view.clearCache();
		events.dispatch('spriteSheetRerendered');
	};

	store.subscribe('colorScheme', rerenderSpriteSheet);
	store.subscribe('editorSettings.font', rerenderSpriteSheet);
}
