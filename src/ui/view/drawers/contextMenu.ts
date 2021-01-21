const drawContextMenu = function (engine, state) {
	const { open, items, position, highlightedItem, itemHeight, itemWidth } = state.ui.contextMenu;

	if (!open) {
		return;
	}

	for (let i = 0; i < items.length; i++) {
		engine.startGroup(position[0], position[1] + i * itemHeight);
		if (i === highlightedItem) {
			engine.drawSprite(0, 0, 'white', itemWidth, itemHeight);
			engine.drawText(6, 3, items[i].title, 'black_');
		} else {
			engine.drawSprite(0, 0, 'black', itemWidth, itemHeight);
			engine.drawText(6, 3, items[i].title);
		}
		engine.endGroup();
	}
};

export default drawContextMenu;
