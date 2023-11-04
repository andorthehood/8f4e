import { GraphicHelper, CodeBlockGraphicData, Switch } from '../types';

export default function findSwitchAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	module: CodeBlockGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return Array.from(module.switches.values()).find(_switch => {
		return (
			x >= module.x + module.offsetX + _switch.x - graphicHelper.viewport.x &&
			x <= module.x + module.offsetX + _switch.width + _switch.x - graphicHelper.viewport.x &&
			y >= module.y + module.offsetY + _switch.y - graphicHelper.viewport.y &&
			y <= module.y + module.offsetY + _switch.height + _switch.y - graphicHelper.viewport.y
		);
	});
}
