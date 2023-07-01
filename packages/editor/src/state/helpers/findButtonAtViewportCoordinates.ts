import { Viewport, ModuleGraphicData, Switch } from '../types';

export default function findButtonAtViewportCoordinates(
	viewport: Viewport,
	module: ModuleGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return Array.from(module.buttons.values()).find(button => {
		return (
			x >= module.x + viewport.x + button.x &&
			x <= module.x + button.width + viewport.x + button.x &&
			y >= module.y + viewport.y + button.y &&
			y <= module.y + button.height + viewport.y + button.y
		);
	});
}
