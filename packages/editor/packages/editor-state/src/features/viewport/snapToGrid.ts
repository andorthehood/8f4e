import roundToGrid from './roundToGrid';
import updateViewport from './updateViewport';

import type { EventDispatcher, State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

export default function snapToGrid(state: State, events?: EventDispatcher): void {
	const [x, y] = roundToGrid(state.viewport.x, state.viewport.y, state.viewport);
	updateViewport(
		state,
		viewport => {
			viewport.x = x;
			viewport.y = y;
		},
		events
	);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('snapToGrid', () => {
		it('snaps viewport coordinates to the closest grid cell and updates borders', () => {
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

			snapToGrid(state);

			const viewport = state.viewport;
			expect(viewport.x).toBe(32);
			expect(viewport.y).toBe(48);
			expect(viewport.borderLineCoordinates.left.startX).toBe(32);
			expect(viewport.borderLineCoordinates.top.startY).toBe(48);
			expect(viewport.center).toEqual({ x: 72, y: 68 });
		});
	});
}
