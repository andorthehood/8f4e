import calculateBorderLineCoordinates from './calculateBorderLineCoordinates';

import type { State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

export default function snapToGrid(state: State): void {
	state.graphicHelper.viewport.x =
		Math.round(state.graphicHelper.viewport.x / state.graphicHelper.viewport.vGrid) *
		state.graphicHelper.viewport.vGrid;
	state.graphicHelper.viewport.y =
		Math.round(state.graphicHelper.viewport.y / state.graphicHelper.viewport.hGrid) *
		state.graphicHelper.viewport.hGrid;
	calculateBorderLineCoordinates(state);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('snapToGrid', () => {
		it('snaps viewport coordinates to the closest grid cell and updates borders', () => {
			const state = createMockState({
				graphicHelper: {
					viewport: {
						x: 33,
						y: 41,
						vGrid: 8,
						hGrid: 16,
						width: 80,
						height: 40,
					},
				},
			});

			snapToGrid(state);

			const viewport = state.graphicHelper.viewport;
			expect(viewport.x).toBe(32);
			expect(viewport.y).toBe(48);
			expect(viewport.borderLineCoordinates.left.startX).toBe(32);
			expect(viewport.borderLineCoordinates.top.startY).toBe(48);
			expect(viewport.center).toEqual({ x: 72, y: 68 });
		});
	});
}
