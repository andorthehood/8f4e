import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import { HGRID, VGRID } from './consts';

import { State } from '../../state/types';

export default function drawContextMenu(engine: Engine, state: State): void {
	const { open, items, x, y, highlightedItem, itemWidth } = state.graphicHelper.contextMenu;

	if (!open) {
		return;
	}

	engine.startGroup(x, y);
	for (let i = 0; i < items.length; i++) {
		engine.startGroup(0, i * HGRID);
		if (i === highlightedItem && !items[i].disabled) {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'menuItemBackgroundHighlighted', itemWidth, HGRID);
			engine.setSpriteLookup(font('menuItemTextHighlighted'));
			engine.drawText(VGRID, 0, items[i].title);
		} else {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'menuItemBackground', itemWidth, HGRID);
			engine.setSpriteLookup(font('menuItemText'));
			engine.drawText(VGRID, 0, items[i].title);
		}
		engine.endGroup();
	}
	engine.endGroup();
}
