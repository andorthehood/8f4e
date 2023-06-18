import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import { State } from '../../state/types';

export default function drawContextMenu(engine: Engine, state: State): void {
	if (!state.contextMenu) {
		return;
	}

	const { open, items, x, y, highlightedItem, itemHeight, itemWidth } = state.contextMenu;

	if (!open) {
		return;
	}

	engine.startGroup(x, y);
	for (let i = 0; i < items.length; i++) {
		engine.startGroup(0, i * itemHeight);
		if (i === highlightedItem) {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'menuItemBackgroundHighlighted', itemWidth, itemHeight);
			engine.setSpriteLookup(font('menuItemTextHighlighted'));
			engine.drawText(6, 3, items[i].title);
		} else {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'menuItemBackground', itemWidth, itemHeight);
			engine.setSpriteLookup(font('menuItemText'));
			engine.drawText(6, 3, items[i].title);
		}
		engine.endGroup();
	}
	engine.endGroup();
}
