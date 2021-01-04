import { createRectangleBuffer } from './utils.js';

export const createRectangleBufferFromUiData = ui => {
	return ui.modules.map(({ position, size, connectors }) => {
		return [...createRectangleBuffer(position[0], position[1], size[0], size[1])];
	});
};

export const createLineBufferFromUiData = ui => {
	return ui.connections.map(({ fromModule, fromConnector, toModule, toConnector }) => {
		const a = ui.modules.find(({ id }) => id === fromModule);
		const b = ui.modules.find(({ id }) => id === toModule);
		return [
			a.connectors[fromConnector].position[0] + a.position[0] + 5,
			a.connectors[fromConnector].position[1] + a.position[1] + 5,
			b.connectors[toConnector].position[0] + b.position[0] + 5,
			b.connectors[toConnector].position[1] + b.position[1] + 5,
		];
	});
};
