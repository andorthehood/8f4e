import type { CodeBlockGraphicData, GraphicHelper, Switch } from '../types';

export default function findSwitchAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return Object.values(codeBlock.extras.switches).find(_switch => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + _switch.x - graphicHelper.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + _switch.width + _switch.x - graphicHelper.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + _switch.y - graphicHelper.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + _switch.height + _switch.y - graphicHelper.viewport.y
		);
	});
}
