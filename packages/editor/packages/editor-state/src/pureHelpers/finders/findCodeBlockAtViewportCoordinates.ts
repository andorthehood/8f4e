import type { CodeBlockGraphicData, GraphicHelper } from '../../types';

/**
 * Searches all code blocks (topmost first) for the one that contains the viewport-relative coordinates.
 * This is used to forward click/drag gestures to the correct block while respecting z-order determined
 * by the rendering stack (`codeBlocks` is iterated in reverse so later blocks, which render on top, win).
 * @param graphicHelper Graphic helper that tracks visible blocks and viewport offsets.
 * @param searchX Viewport-relative x coordinate to test.
 * @param searchY Viewport-relative y coordinate to test.
 * @returns The foremost block containing the point, or `undefined` when none overlap it.
 */
export default function findCodeBlockAtViewportCoordinates(
	graphicHelper: GraphicHelper,
	searchX: number,
	searchY: number
): CodeBlockGraphicData | undefined {
	for (const graphicData of Array.from(graphicHelper.codeBlocks).reverse()) {
		const { width, height, x, y, offsetX, offsetY } = graphicData;
		if (
			searchX >= x + offsetX - graphicHelper.viewport.x &&
			searchX <= x + offsetX + width - graphicHelper.viewport.x &&
			searchY >= y + offsetY - graphicHelper.viewport.y &&
			searchY <= y + offsetY + height - graphicHelper.viewport.y
		) {
			return graphicData;
		}
	}
}
