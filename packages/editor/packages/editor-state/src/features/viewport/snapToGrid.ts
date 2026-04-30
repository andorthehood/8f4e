import roundToGrid from './roundToGrid';

import type { Position, State } from '@8f4e/editor-state-types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

export default function snapToGrid(state: State): Position {
	const [x, y] = roundToGrid(state.viewport.x, state.viewport.y, state.viewport);
	return { x, y };
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

			const position = snapToGrid(state);

			expect(position).toEqual({ x: 32, y: 48 });
		});
	});
}
