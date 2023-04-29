import { Switch, Viewport, ModuleGraphicData } from '../types';

export default function findSwitchAtViewportCoordinates(
	viewport: Viewport,
	module: ModuleGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return Array.from(module.switches.values()).find(_switch => {
		return (
			x >= module.x + viewport.x + _switch.x &&
			x <= module.x + _switch.width + viewport.x + _switch.x &&
			y >= module.y + viewport.y + _switch.y &&
			y <= module.y + _switch.height + viewport.y + _switch.y
		);
	});
}
