import type { Position, State } from '@8f4e/editor-state-types';

export interface ViewportSnapDirection {
	movementX?: number;
	movementY?: number;
}

function snapAxis(value: number, grid: number, movement?: number): number {
	if (!movement) {
		return Math.round(value / grid) * grid;
	}

	if (movement > 0) {
		return Math.floor(value / grid) * grid;
	}

	return Math.ceil(value / grid) * grid;
}

/**
 * Snaps the viewport to grid using the last wheel-scroll direction instead of neutral rounding.
 *
 * This exists separately from `snapToGrid()` because mouse dragging should still snap to the
 * nearest grid cell on release, while wheel-based panning feels better when it continues in the
 * user's final scroll direction. Keeping the behaviors in separate helpers makes that distinction
 * explicit and avoids mixing wheel-specific heuristics into the generic snap path.
 */
export default function snapToGridConsideringDirection(state: State, direction: ViewportSnapDirection): Position {
	return {
		x: snapAxis(state.viewport.x, state.viewport.vGrid, direction.movementX),
		y: snapAxis(state.viewport.y, state.viewport.hGrid, direction.movementY),
	};
}
