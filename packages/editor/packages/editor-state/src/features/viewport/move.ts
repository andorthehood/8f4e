import calculateBorderLineCoordinates from './calculateBorderLineCoordinates';

import type { State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

export default function move(state: State, movementX: number, movementY: number): void {
	state.graphicHelper.viewport.x -= movementX;
	state.graphicHelper.viewport.y -= movementY;
	calculateBorderLineCoordinates(state);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('move', () => {
		it('shifts the viewport by the provided delta and updates borders', () => {
			const state = createMockState({
				graphicHelper: {
					viewport: {
						x: 200,
						y: 150,
						width: 100,
						height: 80,
					},
				},
			});

			move(state, 25, -10);

			const viewport = state.graphicHelper.viewport;
			expect(viewport.x).toBe(175);
			expect(viewport.y).toBe(160);
			expect(viewport.borderLineCoordinates.top.startX).toBe(175);
			expect(viewport.borderLineCoordinates.left.startY).toBe(160);
		});
	});
}
