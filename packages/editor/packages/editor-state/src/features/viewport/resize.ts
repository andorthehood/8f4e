import calculateBorderLineCoordinates from './calculateBorderLineCoordinates';

import { createMockState } from '../../pureHelpers/testingUtils/testUtils';

import type { State } from '../../types';

export default function resize(state: State, width: number, height: number): void {
	state.graphicHelper.viewport.width = width;
	state.graphicHelper.viewport.height = height;
	state.graphicHelper.viewport.roundedWidth =
		Math.floor(width / state.graphicHelper.viewport.vGrid) * state.graphicHelper.viewport.vGrid;
	state.graphicHelper.viewport.roundedHeight =
		Math.floor(height / state.graphicHelper.viewport.hGrid) * state.graphicHelper.viewport.hGrid;
	calculateBorderLineCoordinates(state);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('resize', () => {
		it('updates viewport dimensions, rounded values, and borders', () => {
			const state = createMockState({
				graphicHelper: {
					viewport: {
						x: 5,
						y: 15,
						vGrid: 8,
						hGrid: 10,
					},
				},
			});

			resize(state, 123, 95);

			const viewport = state.graphicHelper.viewport;
			expect(viewport.width).toBe(123);
			expect(viewport.height).toBe(95);
			expect(viewport.roundedWidth).toBe(120);
			expect(viewport.roundedHeight).toBe(90);
			expect(viewport.borderLineCoordinates.top.endX).toBe(128);
			expect(viewport.borderLineCoordinates.bottom.endY).toBe(110);
		});
	});
}
