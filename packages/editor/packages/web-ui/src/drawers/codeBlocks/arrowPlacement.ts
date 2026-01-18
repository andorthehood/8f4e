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
 * Calculates the intersection point of two line segments.
 *
 * @returns The intersection coordinates, or null if lines are parallel or don't intersect
 */
function calculateIntersection(
	line1StartX: number,
	line1StartY: number,
	line1EndX: number,
	line1EndY: number,
	line2StartX: number,
	line2StartY: number,
	line2EndX: number,
	line2EndY: number
) {
	const denominator =
		(line2EndY - line2StartY) * (line1EndX - line1StartX) - (line2EndX - line2StartX) * (line1EndY - line1StartY);

	if (denominator === 0) {
		// Lines are parallel
		return null;
	}

	const a = line1StartY - line2StartY;
	const b = line1StartX - line2StartX;
	const numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b;
	const numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b;

	const r = numerator1 / denominator;
	const s = numerator2 / denominator;

	if (r < 0 || r > 1 || s < 0 || s > 1) {
		// Lines do not intersect
		return null;
	}

	const intersectionX = line1StartX + r * (line1EndX - line1StartX);
	const intersectionY = line1StartY + r * (line1EndY - line1StartY);

	return { x: intersectionX, y: intersectionY };
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

	const topIntersection = calculateIntersection(
		state.viewport.borderLineCoordinates.top.startX,
		state.viewport.borderLineCoordinates.top.startY,
		state.viewport.borderLineCoordinates.top.endX,
		state.viewport.borderLineCoordinates.top.endY,
		state.viewport.center.x,
		state.viewport.center.y,
		codeBlock.x + codeBlock.offsetX,
		codeBlock.y + codeBlock.offsetY
	);

	if (topIntersection) {
		arrowPlacement.top = topIntersection;
	}

	const rightIntersection = calculateIntersection(
		state.viewport.borderLineCoordinates.right.startX,
		state.viewport.borderLineCoordinates.right.startY,
		state.viewport.borderLineCoordinates.right.endX,
		state.viewport.borderLineCoordinates.right.endY,
		state.viewport.center.x,
		state.viewport.center.y,
		codeBlock.x + codeBlock.offsetX,
		codeBlock.y + codeBlock.offsetY
	);

	if (rightIntersection) {
		arrowPlacement.right = rightIntersection;
	}

	const bottomIntersection = calculateIntersection(
		state.viewport.borderLineCoordinates.bottom.startX,
		state.viewport.borderLineCoordinates.bottom.startY,
		state.viewport.borderLineCoordinates.bottom.endX,
		state.viewport.borderLineCoordinates.bottom.endY,
		state.viewport.center.x,
		state.viewport.center.y,
		codeBlock.x + codeBlock.offsetX,
		codeBlock.y + codeBlock.offsetY
	);

	if (bottomIntersection) {
		arrowPlacement.bottom = bottomIntersection;
	}

	const leftIntersection = calculateIntersection(
		state.viewport.borderLineCoordinates.left.startX,
		state.viewport.borderLineCoordinates.left.startY,
		state.viewport.borderLineCoordinates.left.endX,
		state.viewport.borderLineCoordinates.left.endY,
		state.viewport.center.x,
		state.viewport.center.y,
		codeBlock.x + codeBlock.offsetX,
		codeBlock.y + codeBlock.offsetY
	);

	if (leftIntersection) {
		arrowPlacement.left = leftIntersection;
	}

	return arrowPlacement;
}
