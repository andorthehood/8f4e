import { Engine } from '2d-engine';
import { font, fillColor } from 'sprite-generator';
import { State } from '../../state/types';

export default function drawContextMenu(engine: Engine, state: State): void {
	const { open, items, x, y, highlightedItem, itemHeight, itemWidth } = state.contextMenu;

	if (!open) {
		return;
	}

	engine.startGroup(x, y);
	for (let i = 0; i < items.length; i++) {
		engine.startGroup(0, i * itemHeight);
		if (i === highlightedItem) {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(255,255,255)', itemWidth, itemHeight);
			engine.setSpriteLookup(font('small_black'));
			engine.drawText(6, 3, items[i].title);
		} else {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(0,0,0)', itemWidth, itemHeight);
			engine.setSpriteLookup(font('small_white'));
			engine.drawText(6, 3, items[i].title);
		}
		engine.endGroup();
	}
	engine.endGroup();
}
