const drawModules = function (engine, state) {
	const offsetX = state.ui.viewport.x;
	const offsetY = state.ui.viewport.y;

	state.ui.modules.forEach(({ x, y, type }) => {
		const { width, height, name, connectors } = state.ui.moduleTypes[type];

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.ui.viewport.width &&
			y + offsetY < state.ui.viewport.height
		) {
			engine.startGroup(x + offsetX, y + offsetY);
			engine.drawRectangle(0, 0, width, height);
			engine.drawText(5, 5, name);

			const connectorIds = Object.keys(connectors);

			for (let i = 0; i < connectorIds.length; i++) {
				engine.drawRectangle(connectors[connectorIds[i]].x, connectors[connectorIds[i]].y, 10, 10);
			}

			engine.endGroup();
		}
	});
};

export default drawModules;
