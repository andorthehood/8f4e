import type { CodeBlockGraphicData, State, Slider } from '~/types';

/**
 * Performs a hit test against slider decorations inside a code block using viewport-relative coordinates.
 * @param state State providing the current viewport origin.
 * @param codeBlock Code block containing sliders to check.
 * @param x Viewport-relative x coordinate.
 * @param y Viewport-relative y coordinate.
 * @returns The first slider that intersects the point, or `undefined` if none do.
 */
export default function findSliderAtViewportCoordinates(
	state: State,
	codeBlock: CodeBlockGraphicData,
	x: number,
	y: number
): Slider | undefined {
	return codeBlock.extras.sliders.find(slider => {
		return (
			x >= codeBlock.x + codeBlock.offsetX + slider.x - state.viewport.x &&
			x <= codeBlock.x + codeBlock.offsetX + slider.width + slider.x - state.viewport.x &&
			y >= codeBlock.y + codeBlock.offsetY + slider.y - state.viewport.y &&
			y <= codeBlock.y + codeBlock.offsetY + slider.height + slider.y - state.viewport.y
		);
	});
}
