import type { CodeBlockGraphicData, State, Switch } from '~/types';

/**
 * Performs a hit test against switch decorations inside a code block using viewport-relative coordinates.
 * @param state State providing the current viewport origin.
 * @param codeBlock Code block containing switches to check.
 * @param x Viewport-relative x coordinate.
 * @param y Viewport-relative y coordinate.
 * @returns The first switch that intersects the point, or `undefined` if none do.
 */
export default function findSwitchAtViewportCoordinates(
	state: State,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Switch | undefined {
	return codeBlock.extras.switches.find(_switch => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + _switch.x - state.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + _switch.width + _switch.x - state.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + _switch.y - state.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + _switch.height + _switch.y - state.viewport.y
		);
	});
}
