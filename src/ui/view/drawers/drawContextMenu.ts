const drawContextMenu = function (engine, ui) {
	const menuItems = ['New module', 'Close'];

	for (let i = 0; i < menuItems.length; i++) {
		engine.drawSprite(100, 70 + i * 20, 'white', 200, 20);
		engine.drawText(120, 70 + i * 20, menuItems[i], 'black_');
	}
};

export default drawContextMenu;
