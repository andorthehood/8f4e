import type { State } from '@8f4e/editor-state';
import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher } from './events';

type SpriteSheetView = {
	reloadSpriteSheet: () => void;
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
		view.reloadSpriteSheet();
		view.clearCache();
		events.dispatch('spriteSheetRerendered');
	};

	store.subscribe('colorScheme', rerenderSpriteSheet);
	store.subscribe('editorSettings.font', rerenderSpriteSheet);
}
