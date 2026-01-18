import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawContextMenu(engine: Engine, state: State): void {
	const { open, items, x, y, highlightedItem, itemWidth } = state.graphicHelper.contextMenu;

	if (!open || !state.graphicHelper.spriteLookups) {
		return;
	}

	engine.startGroup(x, y);
	for (let i = 0; i < items.length; i++) {
		engine.startGroup(0, i * state.viewport.hGrid);
		if (i === highlightedItem && !items[i].disabled && !items[i].divider) {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
			engine.drawSprite(0, 0, 'menuItemBackgroundHighlighted', itemWidth, state.viewport.hGrid);
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontMenuItemTextHighlighted);
		} else {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
			engine.drawSprite(0, 0, 'menuItemBackground', itemWidth, state.viewport.hGrid);
			engine.setSpriteLookup(
				items[i].disabled
					? state.graphicHelper.spriteLookups.fontLineNumber
					: state.graphicHelper.spriteLookups.fontMenuItemText
			);
		}
		if (!items[i].divider) {
			engine.drawText(0, 0, items[i].title || '');
		}
		engine.endGroup();
	}
	engine.endGroup();
}
