import updateViewport from './updateViewport';

import type { EventDispatcher, State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

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
export default function snapToGridConsideringDirection(
	state: State,
	direction: ViewportSnapDirection,
	events?: EventDispatcher
): void {
	updateViewport(
		state,
		viewport => {
			viewport.x = snapAxis(viewport.x, viewport.vGrid, direction.movementX);
			viewport.y = snapAxis(viewport.y, viewport.hGrid, direction.movementY);
		},
		events
	);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('snapToGridConsideringDirection', () => {
		it('snaps upward viewport movement to the previous vertical grid line', () => {
			const state = createMockState({
				viewport: {
					x: 33,
					y: 41,
					vGrid: 8,
					hGrid: 16,
					width: 80,
					height: 40,
				},
			});

			snapToGridConsideringDirection(state, { movementY: 1 });

			expect(state.viewport.y).toBe(32);
		});

		it('snaps downward viewport movement to the next vertical grid line', () => {
			const state = createMockState({
				viewport: {
					x: 33,
					y: 41,
					vGrid: 8,
					hGrid: 16,
					width: 80,
					height: 40,
				},
			});

			snapToGridConsideringDirection(state, { movementY: -1 });

			expect(state.viewport.y).toBe(48);
		});

		it('updates border coordinates after directional snapping', () => {
			const state = createMockState({
				viewport: {
					x: 33,
					y: 41,
					vGrid: 8,
					hGrid: 16,
					width: 80,
					height: 40,
				},
			});

			snapToGridConsideringDirection(state, { movementX: 1, movementY: -1 });

			expect(state.viewport.x).toBe(32);
			expect(state.viewport.y).toBe(48);
			expect(state.viewport.borderLineCoordinates.left.startX).toBe(32);
			expect(state.viewport.borderLineCoordinates.top.startY).toBe(48);
		});
	});
}
