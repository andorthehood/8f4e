import type { State } from '@8f4e/editor-state';
import type { CodeBlockGraphicData } from '@8f4e/editor-state';

/**
 * Represents the placement coordinates for directional arrow indicators.
 * Each direction is optional and only present when an off-screen module
 * is positioned in that direction relative to the viewport center.
 */
export interface ArrowPlacement {
	top?: { x: number; y: number };
	right?: { x: number; y: number };
	bottom?: { x: number; y: number };
	left?: { x: number; y: number };
}

/**
 * Calculates arrow placement positions for an off-screen code block.
 * This function determines where directional arrows should be drawn at the viewport edges
 * to indicate the position of code blocks that are not currently visible.
 *
 * @param codeBlock - The code block graphic data to calculate arrow placements for
 * @param state - The editor state containing viewport and global viewport information
 * @returns An object with optional arrow positions for each direction (top, right, bottom, left)
 */
export function calculateArrowPlacement(codeBlock: CodeBlockGraphicData, state: State): ArrowPlacement {
	const arrowPlacement: ArrowPlacement = {};
	const { borderLineCoordinates, center } = state.viewport;
	const targetX = codeBlock.x + codeBlock.offsetX;
	const targetY = codeBlock.y + codeBlock.offsetY;
	const deltaX = targetX - center.x;
	const deltaY = targetY - center.y;

	if (deltaX === 0 && deltaY === 0) {
		return arrowPlacement;
	}

	const horizontalDistance =
		deltaX >= 0 ? borderLineCoordinates.right.startX - center.x : center.x - borderLineCoordinates.left.startX;
	const verticalDistance =
		deltaY >= 0 ? borderLineCoordinates.bottom.startY - center.y : center.y - borderLineCoordinates.top.startY;
	const horizontalScale = deltaX === 0 ? Number.POSITIVE_INFINITY : horizontalDistance / Math.abs(deltaX);
	const verticalScale = deltaY === 0 ? Number.POSITIVE_INFINITY : verticalDistance / Math.abs(deltaY);
	const scale = Math.min(horizontalScale, verticalScale);
	const placement = {
		x: Math.round(center.x + deltaX * scale),
		y: Math.round(center.y + deltaY * scale),
	};

	if (horizontalScale < verticalScale) {
		arrowPlacement[deltaX >= 0 ? 'right' : 'left'] = placement;
	} else {
		arrowPlacement[deltaY >= 0 ? 'bottom' : 'top'] = placement;
	}

	return arrowPlacement;
}
