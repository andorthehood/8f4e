const drawModules = function (engine, ui) {
	const [offsetX, offsetY] = ui.offset;

	ui.modules.forEach(({ position, size }) => {
		engine.drawRectangle(position[0] + offsetX, position[1] + offsetY, ...size);
		//engine.drawSprite(...position, ...size, 0, 0);
	});

	for (let i = 0; i < ui.modules.length; i++) {
		engine.drawText(ui.modules[i].position[0] + offsetX, ui.modules[i].position[1] + offsetY, ui.modules[i].name);
	}
};

export default drawModules;
