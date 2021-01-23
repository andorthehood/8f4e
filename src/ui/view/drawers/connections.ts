const drawConnections = function (engine, state) {
	const ui = state.ui;
	const connections = state.ui.connections;
	const modules = state.ui.modules;
	const moduleTypes = state.ui.moduleTypes;

	for (let i = 0; i < connections.length; i++) {
		const { fromModule, fromConnector, toModule, toConnector } = connections[i];
		const a = modules.find(({ id }) => id === fromModule);
		const b = modules.find(({ id }) => id === toModule);

		let { x: fromX, y: fromY } = moduleTypes[a.type].connectors.find(({ id }) => id === fromConnector);
		let { x: toX, y: toY } = moduleTypes[b.type].connectors.find(({ id }) => id === toConnector);

		fromX += a.x;
		fromY += a.y;

		toX += b.x;
		toY += b.y;

		engine.startGroup(5 + state.ui.viewport.x, 5 + state.ui.viewport.y);
		engine.drawLine(fromX, fromY, toX, toY, 'grey', 1);
		engine.endGroup();
	}

	if (state.ui.isConnectionBeingMade && state.ui.connectionPointA && state.ui.connectionPointB) {
		engine.drawLine(...ui.connectionPointA, ...ui.connectionPointB, 'grey', 1);
	}
};

export default drawConnections;
