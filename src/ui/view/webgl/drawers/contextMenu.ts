const drawContextMenu = function (engine) {
	const menuItems = ['New module', 'Close'];

	for (let i = 0; i < menuItems.length; i++) {
		engine.drawSprite(0, i * 20, 200, 20, 0, 1, 1, 1);
		engine.drawText(0, i * 20, menuItems[i]);
	}
};

export default drawContextMenu;
