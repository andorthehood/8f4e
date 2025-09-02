import type { CodeBlockGraphicData, GraphicHelper, Switch } from '../types';

export default function findButtonAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return Array.from(codeBlock.extras.buttons.values()).find(button => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + button.x - graphicHelper.activeViewport.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + button.width + button.x - graphicHelper.activeViewport.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + button.y - graphicHelper.activeViewport.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + button.height + button.y - graphicHelper.activeViewport.viewport.y
		);
	});
}
