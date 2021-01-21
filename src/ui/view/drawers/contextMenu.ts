const drawContextMenu = function (engine, state) {
	const { open, items, x, y, highlightedItem, itemHeight, itemWidth } = state.ui.contextMenu;

	if (!open) {
		return;
	}

	engine.startGroup(x, y);
	for (let i = 0; i < items.length; i++) {
		engine.startGroup(0, i * itemHeight);
		if (i === highlightedItem) {
			engine.drawSprite(0, 0, 'white', itemWidth, itemHeight);
			engine.drawText(6, 3, items[i].title, 'black_');
		} else {
			engine.drawSprite(0, 0, 'black', itemWidth, itemHeight);
			engine.drawText(6, 3, items[i].title);
		}
		engine.endGroup();
	}
	engine.endGroup();
};

export default drawContextMenu;
