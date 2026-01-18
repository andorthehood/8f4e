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

/**
 * Runtime viewport type using pixel coordinates.
 * Used in graphicHelper.viewport for runtime rendering.
 * This is separate from ProjectViewport which uses grid coordinates for persistence.
 */
export type Viewport = {
	x: number;
	y: number;
	animationDurationMs?: number;
};
