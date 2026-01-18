/**
 * Types for viewport feature - manages camera position and coordinate system conversions.
 */

import type { GridCoordinates } from '../../shared/types';

/**
 * Project-level viewport using grid coordinates.
 * Used in Project for persistent storage - converted to pixel coordinates at runtime.
 */
export interface ProjectViewport {
	gridCoordinates: GridCoordinates;
	animationDurationMs?: number;
}

export interface Viewport {
	width: number;
	height: number;
	roundedWidth: number;
	roundedHeight: number;
	vGrid: number;
	hGrid: number;
	borderLineCoordinates: {
		top: { startX: number; startY: number; endX: number; endY: number };
		right: { startX: number; startY: number; endX: number; endY: number };
		bottom: { startX: number; startY: number; endX: number; endY: number };
		left: { startX: number; startY: number; endX: number; endY: number };
	};
	center: { x: number; y: number };
	x: number;
	y: number;
	animationDurationMs?: number;
}
