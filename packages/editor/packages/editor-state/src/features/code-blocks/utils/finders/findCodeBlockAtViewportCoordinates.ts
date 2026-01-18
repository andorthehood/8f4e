import type { CodeBlockGraphicData, State } from '~/types';

/**
 * Searches all code blocks (topmost first) for the one that contains the viewport-relative coordinates.
 * This is used to forward click/drag gestures to the correct block while respecting z-order determined
 * by the rendering stack (`codeBlocks` is iterated in reverse so later blocks, which render on top, win).
 * @param state State providing the current viewport origin and graphic helper.
 * @param searchX Viewport-relative x coordinate to test.
 * @param searchY Viewport-relative y coordinate to test.
 * @returns The foremost block containing the point, or `undefined` when none overlap it.
 */
export default function findCodeBlockAtViewportCoordinates(
	state: State,
	searchX: number,
	searchY: number
): CodeBlockGraphicData | undefined {
	for (let index = state.graphicHelper.codeBlocks.length - 1; index >= 0; index -= 1) {
		const graphicData = state.graphicHelper.codeBlocks[index];
		const { width, height, x, y, offsetX, offsetY } = graphicData;
		if (
			searchX >= x + offsetX - state.viewport.x &&
			searchX <= x + offsetX + width - state.viewport.x &&
			searchY >= y + offsetY - state.viewport.y &&
			searchY <= y + offsetY + height - state.viewport.y
		) {
			return graphicData;
		}
	}
}
