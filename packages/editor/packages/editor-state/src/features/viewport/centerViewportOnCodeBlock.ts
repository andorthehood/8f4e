import { GraphicHelper } from '~/types';

/**
 * Minimal positional data required for viewport centering
 */
export interface CodeBlockBounds {
	x: number;
	y: number;
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
}

/**
 * Centers the viewport on a given code block, ensuring the top edge is always visible.
 *
 * This function mutates the viewport object to position it such that the code block
 * appears centered on screen. For blocks smaller than the viewport, perfect centering
 * is achieved. For blocks larger than the viewport, the top edge is prioritized and
 * remains visible while the bottom may extend beyond the viewport.
 *
 * @param viewport - The viewport object to mutate (will be modified in place)
 * @param codeBlock - The code block to center on
 *
 * @remarks
 * **Centering Behavior:**
 * - Horizontally: Block is centered within the viewport width
 * - Vertically: Block is centered, but constrained so top edge is always visible
 *
 * **Constraints:**
 * - The top edge of the code block never goes offscreen
 * - For large blocks (taller than viewport), only the bottom may be clipped
 * - Code block offsets (offsetX, offsetY) are included in calculations
 *
 * **Implementation Notes:**
 * - This function mutates the viewport parameter directly
 * - Coordinates use pixels, not grid units (grid conversion happens elsewhere)
 * - Negative viewport coordinates are allowed (viewport can pan anywhere)
 */
export default function centerViewportOnCodeBlock<T extends CodeBlockBounds>(
	viewport: GraphicHelper['viewport'],
	codeBlock: T
): void {
	const blockCenterX = codeBlock.x + codeBlock.offsetX + codeBlock.width / 2;
	const blockCenterY = codeBlock.y + codeBlock.offsetY + codeBlock.height / 2;

	const viewportCenterX = viewport.width / 2;
	const viewportCenterY = viewport.height / 2;

	const idealViewportX = blockCenterX - viewportCenterX;
	const idealViewportY = blockCenterY - viewportCenterY;

	const blockTop = codeBlock.y + codeBlock.offsetY;
	const constrainedViewportY = Math.min(blockTop, idealViewportY);

	viewport.x = Math.round(idealViewportX);
	viewport.y = Math.round(constrainedViewportY);
}
