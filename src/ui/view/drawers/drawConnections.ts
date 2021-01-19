const drawConnections = function (engine) {
	const ui = window.ui;
	const [offsetX, offsetY] = ui.offset;

	ui.connections.forEach(({ fromModule, fromConnector, toModule, toConnector }) => {
		const a = ui.modules.find(({ id }) => id === fromModule);
		const b = ui.modules.find(({ id }) => id === toModule);
		const line = [
			a.connectors[fromConnector].position[0] + a.position[0] + 5 + offsetX,
			a.connectors[fromConnector].position[1] + a.position[1] + 5 + offsetY,
			b.connectors[toConnector].position[0] + b.position[0] + 5 + offsetX,
			b.connectors[toConnector].position[1] + b.position[1] + 5 + offsetY,
		];
		engine.drawLine(...line);
	});
};

export default drawConnections;
