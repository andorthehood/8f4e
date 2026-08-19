import type { State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../drawContext';

export default function drawContextMenu(engine: DrawContext, state: State): void {
	const { open, items, x, y, highlightedItem, itemWidth } = state.contextMenu;

	if (!open || !state.spriteLookups) {
		return;
	}

	engine.pushOffset(x - state.viewport.x, y - state.viewport.y);
	for (let i = 0; i < items.length; i++) {
		engine.pushOffset(0, i * state.viewport.hGrid);
		let font = state.spriteLookups.fontMenuItemText;
		if (i === highlightedItem && !items[i].disabled && !items[i].divider) {
			engine.drawSprite(
				0,
				0,
				state.spriteLookups.fillColors.menuItemBackgroundHighlighted,
				itemWidth,
				state.viewport.hGrid
			);
			font = state.spriteLookups.fontMenuItemTextHighlighted;
		} else {
			engine.drawSprite(0, 0, state.spriteLookups.fillColors.menuItemBackground, itemWidth, state.viewport.hGrid);
			font = items[i].disabled ? state.spriteLookups.fontLineNumber : state.spriteLookups.fontMenuItemText;
		}
		if (!items[i].divider) {
			engine.drawText(0, 0, items[i].title || '', font);
		}
		engine.popOffset();
	}
	engine.popOffset();
}
