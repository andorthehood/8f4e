const drawConnections = function (engine, state) {
	const ui = state.ui;
	const offsetX = state.ui.viewport.x;
	const offsetY = state.ui.viewport.y;

	ui.connections.forEach(({ fromModule, fromConnector, toModule, toConnector }) => {
		const a = ui.modules.find(({ id }) => id === fromModule);
		const b = ui.modules.find(({ id }) => id === toModule);

		if (!a || !b || !a.connectors || !b.connectors) {
			return;
		}

		const line = [
			a.connectors[fromConnector].x + a.position[0] + 5 + offsetX,
			a.connectors[fromConnector].y + a.position[1] + 5 + offsetY,
			b.connectors[toConnector].x + b.position[0] + 5 + offsetX,
			b.connectors[toConnector].y + b.position[1] + 5 + offsetY,
		];
		engine.drawLine(...line);
	});

	if (ui.isConnectionBeingMade && ui.connectionPointA && ui.connectionPointB) {
		engine.drawLine(ui.connectionPointA[0], ui.connectionPointA[1], ui.connectionPointB[0], ui.connectionPointB[1]);
	}
};

export default drawConnections;
