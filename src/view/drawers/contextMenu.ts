import { font, fillColor } from '../../../packages/spriteGenerator/src';

const drawContextMenu = function (engine, state) {
	const { open, items, x, y, highlightedItem, itemHeight, itemWidth } = state.ui.contextMenu;

	if (!open) {
		return;
	}

	engine.startGroup(x, y);
	for (let i = 0; i < items.length; i++) {
		engine.startGroup(0, i * itemHeight);
		if (i === highlightedItem) {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(255,255,255)', itemWidth, itemHeight);
			engine.setSpriteLookup(font('black_small'));
			engine.drawText(6, 3, items[i].title);
		} else {
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(0,0,0)', itemWidth, itemHeight);
			engine.setSpriteLookup(font('white_small'));
			engine.drawText(6, 3, items[i].title);
		}
		engine.endGroup();
	}
	engine.endGroup();
};

export default drawContextMenu;
