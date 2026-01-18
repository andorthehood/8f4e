import calculateBorderLineCoordinates from './calculateBorderLineCoordinates';

import type { State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

export default function resize(state: State, width: number, height: number): void {
	state.viewport.width = width;
	state.viewport.height = height;
	state.viewport.roundedWidth = Math.floor(width / state.viewport.vGrid) * state.viewport.vGrid;
	state.viewport.roundedHeight = Math.floor(height / state.viewport.hGrid) * state.viewport.hGrid;
	calculateBorderLineCoordinates(state);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('resize', () => {
		it('updates viewport dimensions, rounded values, and borders', () => {
			const state = createMockState({
				viewport: {
					x: 5,
					y: 15,
					vGrid: 8,
					hGrid: 10,
				},
			});

			resize(state, 123, 95);

			const viewport = state.viewport;
			expect(viewport.width).toBe(123);
			expect(viewport.height).toBe(95);
			expect(viewport.roundedWidth).toBe(120);
			expect(viewport.roundedHeight).toBe(90);
			expect(viewport.borderLineCoordinates.top.endX).toBe(128);
			expect(viewport.borderLineCoordinates.bottom.endY).toBe(110);
		});
	});
}
