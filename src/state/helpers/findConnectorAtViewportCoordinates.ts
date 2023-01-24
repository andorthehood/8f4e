import { Connector, GraphicHelper, Module, Viewport } from '../types';

export default function findConnectorAtViewportCoordinates(
	viewport: Viewport,
	graphicHelper: GraphicHelper,
	module: Module,
	x: number,
	y: number
): Connector {
	const input = Array.from(graphicHelper.get(module.id).inputs.values()).find(connector => {
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

	return Array.from(graphicHelper.get(module.id).outputs.values()).find(connector => {
		return (
			x >= module.x + viewport.x + connector.x &&
			x <= module.x + connector.width + viewport.x + connector.x &&
			y >= module.y + viewport.y + connector.y &&
			y <= module.y + connector.height + viewport.y + connector.y
		);
	});
}
