import { Switch, GraphicHelper, Module, Viewport } from '../types';

export default function findSwitchAtViewportCoordinates(
	viewport: Viewport,
	graphicHelper: GraphicHelper,
	module: Module,
	x: number,
	y: number
): Switch | undefined {
	const graphicData = graphicHelper.modules.get(module);

	if (!graphicData) {
		return;
	}

	return Array.from(graphicData.switches.values()).find(_switch => {
		return (
			x >= module.x + viewport.x + _switch.x &&
			x <= module.x + _switch.width + viewport.x + _switch.x &&
			y >= module.y + viewport.y + _switch.y &&
			y <= module.y + _switch.height + viewport.y + _switch.y
		);
	});
}
