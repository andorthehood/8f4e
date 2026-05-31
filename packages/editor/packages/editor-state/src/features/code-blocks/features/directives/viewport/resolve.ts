import type { ViewportAnchor } from '@8f4e/editor-state-types';

export interface ViewportAnchoredPositionInput {
	anchor: ViewportAnchor;
	/** @pos offset along the inward axis (grid units). Positive = inward from anchored edges. */
	posX: number;
	posY: number;
	/** World-space pixel origin of the viewport (top-left corner of visible area). */
	viewportX: number;
	viewportY: number;
	/**
	 * Grid-aligned pixel dimensions of the visible viewport area.
	 * Must be pre-floored to the nearest grid unit (use viewport.roundedWidth / roundedHeight).
	 * Passing raw pixel dimensions will produce off-grid positions for right/bottom anchors.
	 */
	viewportWidth: number;
	viewportHeight: number;
	/** Block pixel dimensions (needed for right/bottom anchoring). */
	blockWidth: number;
	blockHeight: number;
	/** Grid unit sizes for coordinate conversion. */
	vGrid: number;
	hGrid: number;
}

export interface WorldToAnchoredPosInput {
	anchor: ViewportAnchor;
	worldX: number;
	worldY: number;
	viewportX: number;
	viewportY: number;
	viewportWidth: number;
	viewportHeight: number;
	blockWidth: number;
	blockHeight: number;
	vGrid: number;
	hGrid: number;
}

/**
 * Resolves the world-space pixel position of a viewport-anchored code block.
 *
 * @pos is interpreted as an inward offset from the specified viewport corner:
 * - top-left:     +x moves right, +y moves down
 * - top-right:    +x moves left,  +y moves down
 * - bottom-left:  +x moves right, +y moves up
 * - bottom-right: +x moves left,  +y moves up
 *
 * The resulting screen position is clamped so the anchored corner remains within the
 * visible viewport. For blocks larger than the viewport the anchored corner is pinned
 * and overflow is permitted on the opposite side.
 *
 * Returns world-space pixel coordinates (viewport.x/y + screen offset).
 */
export function resolveViewportAnchoredPosition(input: ViewportAnchoredPositionInput): { x: number; y: number } {
	const {
		anchor,
		posX,
		posY,
		viewportX,
		viewportY,
		viewportWidth,
		viewportHeight,
		blockWidth,
		blockHeight,
		vGrid,
		hGrid,
	} = input;

	const offsetX = posX * vGrid;
	const offsetY = posY * hGrid;

	// Compute unclamped screen-space position (relative to viewport top-left).
	let screenX: number;
	let screenY: number;

	switch (anchor) {
		case 'top-left':
			screenX = offsetX;
			screenY = offsetY;
			break;
		case 'top-right':
			screenX = viewportWidth - offsetX - blockWidth;
			screenY = offsetY;
			break;
		case 'bottom-left':
			screenX = offsetX;
			screenY = viewportHeight - offsetY - blockHeight;
			break;
		case 'bottom-right':
			screenX = viewportWidth - offsetX - blockWidth;
			screenY = viewportHeight - offsetY - blockHeight;
			break;
	}

	// Clamp: keep the anchored edge within the viewport; the opposite edge may overflow.
	if (anchor === 'top-left' || anchor === 'bottom-left') {
		// Left-anchored: left edge must stay >= 0.
		if (blockWidth >= viewportWidth) {
			screenX = 0;
		} else {
			screenX = Math.max(0, Math.min(screenX, viewportWidth - blockWidth));
		}
	} else {
		// Right-anchored: right edge must stay <= viewportWidth.
		if (blockWidth >= viewportWidth) {
			screenX = viewportWidth - blockWidth; // negative: left side overflows
		} else {
			screenX = Math.max(0, Math.min(screenX, viewportWidth - blockWidth));
		}
	}

	if (anchor === 'top-left' || anchor === 'top-right') {
		// Top-anchored: top edge must stay >= 0.
		if (blockHeight >= viewportHeight) {
			screenY = 0;
		} else {
			screenY = Math.max(0, Math.min(screenY, viewportHeight - blockHeight));
		}
	} else {
		// Bottom-anchored: bottom edge must stay <= viewportHeight.
		if (blockHeight >= viewportHeight) {
			screenY = viewportHeight - blockHeight;
		} else {
			screenY = Math.max(0, Math.min(screenY, viewportHeight - blockHeight));
		}
	}

	return {
		x: viewportX + screenX,
		y: viewportY + screenY,
	};
}

/**
 * Converts a world-space pixel block position back into @pos anchored offset coordinates
 * for a viewport-anchored block.
 *
 * This is the inverse of resolveViewportAnchoredPosition (without clamping).
 * Used when a viewport-anchored block is dragged to write back the new @pos.
 */
export function worldPositionToAnchoredPos({
	anchor,
	worldX,
	worldY,
	viewportX,
	viewportY,
	viewportWidth,
	viewportHeight,
	blockWidth,
	blockHeight,
	vGrid,
	hGrid,
}: WorldToAnchoredPosInput): { gridX: number; gridY: number } {
	const screenX = worldX - viewportX;
	const screenY = worldY - viewportY;

	let offsetX: number;
	let offsetY: number;

	switch (anchor) {
		case 'top-left':
			offsetX = screenX;
			offsetY = screenY;
			break;
		case 'top-right':
			offsetX = viewportWidth - screenX - blockWidth;
			offsetY = screenY;
			break;
		case 'bottom-left':
			offsetX = screenX;
			offsetY = viewportHeight - screenY - blockHeight;
			break;
		case 'bottom-right':
			offsetX = viewportWidth - screenX - blockWidth;
			offsetY = viewportHeight - screenY - blockHeight;
			break;
	}

	return {
		gridX: Math.round(offsetX / vGrid),
		gridY: Math.round(offsetY / hGrid),
	};
}
