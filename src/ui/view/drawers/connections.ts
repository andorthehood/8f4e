const drawConnections = function (engine, state) {
	const ui = state.ui;
	const connections = state.ui.connections;
	const modules = state.ui.modules;
	const moduleTypes = state.ui.moduleTypes;
	const offsetX = state.ui.viewport.x;
	const offsetY = state.ui.viewport.y;

	for (let i = 0; i < connections.length; i++) {
		const { fromModule, fromConnector, toModule, toConnector } = connections[i];
		const a = modules.find(({ id }) => id === fromModule);
		const b = modules.find(({ id }) => id === toModule);

		const { connectors: aConnectors } = moduleTypes[a.type];
		const { connectors: bConnectors } = moduleTypes[b.type];

		const line = [
			aConnectors[fromConnector].x + a.x + 5 + offsetX,
			aConnectors[fromConnector].y + a.y + 5 + offsetY,
			bConnectors[toConnector].x + b.x + 5 + offsetX,
			bConnectors[toConnector].y + b.y + 5 + offsetY,
		];

		engine.drawLine(...line);
	}

	if (ui.isConnectionBeingMade && ui.connectionPointA && ui.connectionPointB) {
		engine.drawLine(ui.connectionPointA[0], ui.connectionPointA[1], ui.connectionPointB[0], ui.connectionPointB[1]);
	}
};

export default drawConnections;
