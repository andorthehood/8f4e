const drawModules = function (engine) {
	const [offsetX, offsetY] = window.ui.offset;

	const ui = window.ui;
	ui.modules.forEach(({ position, size }) => {
		engine.drawRectangle(position[0] + offsetX, position[1] + offsetY, ...size);
		//engine.drawSprite(...position, ...size, 0, 0);
	});

	for (let i = 0; i < window.ui.modules.length; i++) {
		engine.drawText(
			window.ui.modules[i].position[0] + offsetX,
			window.ui.modules[i].position[1] + offsetY,
			window.ui.modules[i].name
		);
	}
};

export default drawModules;
