import { Connector, Module, ModuleTypeLookup, Viewport } from '../types';

export default function findConnectorAtViewportCoordinates(
	viewport: Viewport,
	moduleTypes: ModuleTypeLookup,
	module: Module,
	x: number,
	y: number
): Connector {
	const input = moduleTypes[module.type].inputs.find(connector => {
		return (
			x >= module.x + viewport.x + connector.x &&
			x <= module.x + connector.width + viewport.x + connector.x &&
			y >= module.y + viewport.y + connector.y &&
			y <= module.y + connector.height + viewport.y + connector.y
		);
	});

	if (input) {
		return { ...input, isInput: true };
	}

	return moduleTypes[module.type].outputs.find(connector => {
		return (
			x >= module.x + viewport.x + connector.x &&
			x <= module.x + connector.width + viewport.x + connector.x &&
			y >= module.y + viewport.y + connector.y &&
			y <= module.y + connector.height + viewport.y + connector.y
		);
	});
}
