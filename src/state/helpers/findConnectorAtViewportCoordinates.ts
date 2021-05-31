import * as moduleTypes from '../../modules';
import { Module, Viewport } from '../types';

export default function findConnectorAtViewportCoordinates(viewport: Viewport, module: Module, x: number, y: number) {
	const input = moduleTypes[module.type].inputs.find(connector => {
		return (
			x >= module.x + viewport.x + connector.x &&
			x <= module.x + 10 + viewport.x + connector.x &&
			y >= module.y + viewport.y + connector.y &&
			y <= module.y + 10 + viewport.y + connector.y
		);
	});

	if (input) {
		return input;
	}

	return moduleTypes[module.type].outputs.find(connector => {
		return (
			x >= module.x + viewport.x + connector.x &&
			x <= module.x + 10 + viewport.x + connector.x &&
			y >= module.y + viewport.y + connector.y &&
			y <= module.y + 10 + viewport.y + connector.y
		);
	});
}
