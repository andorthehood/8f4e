import type { CodeBlockGraphicData, GraphicHelper, Switch } from '../../../types';

/**
 * Locates the button overlay within a code block that intersects the provided viewport-relative coordinates.
 * The hit test accounts for the code block's absolute position, its offsets, and the current viewport origin
 * so callers can pass raw mouse coordinates straight from pointer events.
 * @param graphicHelper Global graphic helper containing viewport offsets.
 * @param codeBlock Code block whose buttons should be searched.
 * @param x Viewport-relative x coordinate (e.g. pointer clientX adjusted by canvas bounds).
 * @param y Viewport-relative y coordinate.
 * @returns The matching button metadata or `undefined` when no button intersects the point.
 */
export default function findButtonAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return codeBlock.extras.buttons.find(button => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + button.x - graphicHelper.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + button.width + button.x - graphicHelper.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + button.y - graphicHelper.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + button.height + button.y - graphicHelper.viewport.y
		);
	});
}
