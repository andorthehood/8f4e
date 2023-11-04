import { GraphicHelper, CodeBlockGraphicData, Switch } from '../types';

export default function findButtonAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	module: CodeBlockGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return Array.from(module.buttons.values()).find(button => {
		return (
			x >= module.x + module.offsetX + button.x - graphicHelper.viewport.x &&
			x <= module.x + module.offsetX + button.width + button.x - graphicHelper.viewport.x &&
			y >= module.y + module.offsetY + button.y - graphicHelper.viewport.y &&
			y <= module.y + module.offsetY + button.height + button.y - graphicHelper.viewport.y
		);
	});
}
