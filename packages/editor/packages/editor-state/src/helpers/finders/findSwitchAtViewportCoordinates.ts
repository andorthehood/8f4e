import type { CodeBlockGraphicData, GraphicHelper, Switch } from '../../types';

/**
 * Performs a hit test against switch decorations inside a code block using viewport-relative coordinates.
 * @param graphicHelper Graphic helper describing the viewport offset.
 * @param codeBlock Code block containing switches to check.
 * @param x Viewport-relative x coordinate.
 * @param y Viewport-relative y coordinate.
 * @returns The first switch that intersects the point, or `undefined` if none do.
 */
export default function findSwitchAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return codeBlock.extras.switches.find(_switch => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + _switch.x - graphicHelper.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + _switch.width + _switch.x - graphicHelper.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + _switch.y - graphicHelper.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + _switch.height + _switch.y - graphicHelper.viewport.y
		);
	});
}
