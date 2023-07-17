import { ModuleGraphicData, Switch, GraphicHelper } from '../types';

export default function findButtonAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	module: ModuleGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return Array.from(module.buttons.values()).find(button => {
		return (
			x >= module.x + button.x - graphicHelper.viewport.x &&
			x <= module.x + button.width + button.x - graphicHelper.viewport.x &&
			y >= module.y + button.y - graphicHelper.viewport.y &&
			y <= module.y + button.height + button.y - graphicHelper.viewport.y
		);
	});
}
