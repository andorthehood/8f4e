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
			engine.drawRectangle(x + offsetX, y + offsetY, width, height);
			engine.drawText(x + offsetX, y + offsetY, name);

			const connectorIds = Object.keys(connectors);

			for (let i = 0; i < connectorIds.length; i++) {
				engine.drawRectangle(
					x + offsetX + connectors[connectorIds[i]].x,
					y + offsetY + connectors[connectorIds[i]].y,
					10,
					10
				);
			}
		}
	});
};

export default drawModules;
