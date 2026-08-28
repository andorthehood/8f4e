import type { State } from '@8f4e/editor-state-types';
import generateSprite from '@8f4e/sprite-generator';
import type { StateManager } from '@8f4e/state-manager';
import type { SpriteData } from '@8f4e/web-ui';
import type { EventDispatcher } from './events';
import { updateStateWithSpriteData } from './updateStateWithSpriteData';

type SpriteSheetView = {
	loadSpriteAtlas: (spriteData: SpriteData) => void;
};

/**
 * Keeps generated sprite-sheet data in sync with editor state changes.
 */
export function createSpriteSheetManager(
	store: StateManager<State>,
	view: SpriteSheetView,
	events: EventDispatcher
): () => void {
	const state = store.getState();
	let disposed = false;
	let generation = 0;
	const rerenderSpriteSheet = async () => {
		const currentGeneration = ++generation;
		const spriteData = await generateSprite({
			font: state.editorConfig.font,
			colorScheme: state.editorConfig.color,
		});
		if (disposed || currentGeneration !== generation) {
			return;
		}

		view.loadSpriteAtlas(spriteData);

		// Update state with new sprite data
		updateStateWithSpriteData(state, spriteData);

		events.dispatch('spriteSheetRerendered');
	};

	store.subscribe('editorConfig.font', rerenderSpriteSheet);
	store.subscribe('editorConfig.color', rerenderSpriteSheet);

	return () => {
		if (disposed) {
			return;
		}

		disposed = true;
		generation++;
		store.unsubscribe('editorConfig.font', rerenderSpriteSheet);
		store.unsubscribe('editorConfig.color', rerenderSpriteSheet);
	};
}
