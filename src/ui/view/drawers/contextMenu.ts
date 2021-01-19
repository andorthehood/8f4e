const drawContextMenu = function (engine, state) {
	const { open, items, position, highlightedItem, itemHeight, itemWidth } = state.ui.contextMenu;

	if (!open) {
		return;
	}

	for (let i = 0; i < items.length; i++) {
		if (i === highlightedItem) {
			engine.drawSprite(position[0], position[1] + i * itemHeight, 'white', itemWidth, itemHeight);
			engine.drawText(position[0] + itemHeight, position[1] + i * itemHeight, items[i].title, 'black_');
		} else {
			engine.drawSprite(position[0], position[1] + i * itemHeight, 'black', itemWidth, itemHeight);
			engine.drawText(position[0] + itemHeight, position[1] + i * itemHeight, items[i].title);
		}
	}
};

export default drawContextMenu;
