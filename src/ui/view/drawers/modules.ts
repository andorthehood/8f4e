const drawModules = function (engine, state) {
	const offsetX = state.ui.viewport.x;
	const offsetY = state.ui.viewport.y;

	state.ui.modules.forEach(({ position, size, name, connectors }) => {
		if (
			position[0] + offsetX > -1 * size[0] &&
			position[1] + offsetY > -1 * size[1] &&
			position[0] + offsetX < state.ui.viewport.width &&
			position[1] + offsetY < state.ui.viewport.height
		) {
			engine.drawRectangle(position[0] + offsetX, position[1] + offsetY, ...size);
			engine.drawText(position[0] + offsetX, position[1] + offsetY, name);

			const connectorIds = Object.keys(connectors);

			for (let i = 0; i < connectorIds.length; i++) {
				engine.drawRectangle(
					position[0] + offsetX + connectors[connectorIds[i]].x,
					position[1] + offsetY + connectors[connectorIds[i]].y,
					10,
					10
				);
			}
		}
	});
};

export default drawModules;
