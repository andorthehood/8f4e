import type { State } from '@8f4e/editor-state-types';

export default function calculateBorderLineCoordinates(state: State): void {
	const viewport = state.viewport;

	// Offscreen arrows intersect against the visible pixel edges of the viewport, not the
	// grid-snapped anchored-position bounds. Keep these lines based on raw width/height so
	// the indicators point at the actual rendered screen boundary even when roundedWidth /
	// roundedHeight are smaller.
	const { borderLineCoordinates, center, x, y, width, height } = viewport;

	borderLineCoordinates.left.startX = x;
	borderLineCoordinates.left.startY = y;
	borderLineCoordinates.left.endX = x;
	borderLineCoordinates.left.endY = y + height;

	borderLineCoordinates.top.startX = x;
	borderLineCoordinates.top.startY = y;
	borderLineCoordinates.top.endX = x + width;
	borderLineCoordinates.top.endY = y;

	borderLineCoordinates.right.startX = x + width;
	borderLineCoordinates.right.startY = y;
	borderLineCoordinates.right.endX = x + width;
	borderLineCoordinates.right.endY = y + height;

	borderLineCoordinates.bottom.startX = x;
	borderLineCoordinates.bottom.startY = y + height;
	borderLineCoordinates.bottom.endX = x + width;
	borderLineCoordinates.bottom.endY = y + height;

	center.x = x + Math.round(width / 2);
	center.y = y + Math.round(height / 2);
}
