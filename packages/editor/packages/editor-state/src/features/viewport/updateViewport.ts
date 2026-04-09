import calculateBorderLineCoordinates from './calculateBorderLineCoordinates';

import type { Viewport } from './types';
import type { EventDispatcher, State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

export interface ViewportChangedEvent {
	previousX: number;
	previousY: number;
	x: number;
	y: number;
}

/**
 * Applies viewport position updates through a single commit path.
 */
export default function updateViewport(
	state: State,
	update: (viewport: Viewport) => void,
	events?: EventDispatcher
): boolean {
	const previousX = state.viewport.x;
	const previousY = state.viewport.y;

	update(state.viewport);
	calculateBorderLineCoordinates(state);

	const changed = state.viewport.x !== previousX || state.viewport.y !== previousY;

	if (changed && events) {
		const event: ViewportChangedEvent = {
			previousX,
			previousY,
			x: state.viewport.x,
			y: state.viewport.y,
		};
		events.dispatch<ViewportChangedEvent>('viewportChanged', event);
		events.dispatch('viewportMoved');
	}

	return changed;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('updateViewport', () => {
		it('recomputes viewport geometry and dispatches viewport lifecycle events', () => {
			const state = createMockState({
				viewport: {
					x: 0,
					y: 0,
					width: 100,
					height: 60,
				},
			});
			const events = createMockEventDispatcherWithVitest();

			updateViewport(
				state,
				viewport => {
					viewport.x = 24;
					viewport.y = 40;
				},
				events
			);

			expect(state.viewport.borderLineCoordinates.left.startX).toBe(24);
			expect(state.viewport.borderLineCoordinates.top.startY).toBe(40);
			expect(events.dispatch).toHaveBeenCalledWith('viewportChanged', {
				previousX: 0,
				previousY: 0,
				x: 24,
				y: 40,
			});
			expect(events.dispatch).toHaveBeenCalledWith('viewportMoved');
		});

		it('does not dispatch movement events when the viewport position is unchanged', () => {
			const state = createMockState();
			const events = createMockEventDispatcherWithVitest();

			updateViewport(
				state,
				viewport => {
					viewport.x = state.viewport.x;
					viewport.y = state.viewport.y;
				},
				events
			);

			expect(events.dispatch).not.toHaveBeenCalled();
		});
	});
}
