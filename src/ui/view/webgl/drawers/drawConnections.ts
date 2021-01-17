const drawConnections = function (engine) {
	const ui = window.ui;
	ui.connections.forEach(({ fromModule, fromConnector, toModule, toConnector }) => {
		const a = ui.modules.find(({ id }) => id === fromModule);
		const b = ui.modules.find(({ id }) => id === toModule);
		const line = [
			a.connectors[fromConnector].position[0] + a.position[0] + 5,
			a.connectors[fromConnector].position[1] + a.position[1] + 5,
			b.connectors[toConnector].position[0] + b.position[0] + 5,
			b.connectors[toConnector].position[1] + b.position[1] + 5,
		];
		engine.drawLine(...line);
	});
};

export default drawConnections;
