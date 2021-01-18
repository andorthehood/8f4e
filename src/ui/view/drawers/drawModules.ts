const drawModules = function (engine) {
	const ui = window.ui;
	ui.modules.forEach(({ position, size }) => {
		engine.drawRectangle(...position, ...size);
		//engine.drawSprite(...position, ...size, 0, 0);
	});

	for (let i = 0; i < window.ui.modules.length; i++) {
		engine.drawText(window.ui.modules[i].position[0], window.ui.modules[i].position[1], window.ui.modules[i].name);
	}
};

export default drawModules;
