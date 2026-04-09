import { Viewport } from './types';

import type { Position } from '~/types';

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
 * Calculates the viewport position needed to center a given code block, ensuring oversized blocks keep a small top margin.
 *
 * For blocks smaller than the viewport, perfect centering is achieved. For blocks
 * larger than the viewport, the block is aligned near the top with a two-row
 * margin while the bottom may extend beyond the viewport.
 *
 * @param viewport - The viewport dimensions and grid sizing to center within
 * @param codeBlock - The code block to center on
 * @returns The viewport position that centers the code block
 *
 * @remarks
 * **Centering Behavior:**
 * - Horizontally: Block is centered within the viewport width
 * - Vertically: Block is centered, but oversized blocks get a two-row top margin
 *
 * **Constraints:**
 * - Oversized blocks get `2 * viewport.hGrid` padding above their top edge
 * - For large blocks (taller than viewport), only the bottom may be clipped
 * - Code block offsets (offsetX, offsetY) are included in calculations
 *
 * **Implementation Notes:**
 * - This function is pure and does not mutate the viewport parameter
 * - Coordinates use pixels, not grid units (grid conversion happens elsewhere)
 * - Negative viewport coordinates are allowed (viewport can pan anywhere)
 */
export default function centerViewportOnCodeBlock<T extends CodeBlockBounds>(
	viewport: Viewport,
	codeBlock: T
): Position {
	const blockCenterX = codeBlock.x + codeBlock.offsetX + codeBlock.width / 2;
	const blockCenterY = codeBlock.y + codeBlock.offsetY + codeBlock.height / 2;

	const viewportCenterX = viewport.width / 2;
	const viewportCenterY = viewport.height / 2;

	const idealViewportX = blockCenterX - viewportCenterX;
	const idealViewportY = blockCenterY - viewportCenterY;

	const blockTop = codeBlock.y + codeBlock.offsetY;
	const oversizedBlockTop = blockTop - viewport.hGrid * 2;
	const constrainedViewportY =
		codeBlock.height > viewport.height ? oversizedBlockTop : Math.min(blockTop, idealViewportY);

	return {
		x: Math.round(idealViewportX),
		y: Math.round(constrainedViewportY),
	};
}
