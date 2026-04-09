import calculateBorderLineCoordinates from './calculateBorderLineCoordinates';

import type { EventDispatcher, State } from '~/types';

export interface ViewportChangedEvent {
	previousX: number;
	previousY: number;
	x: number;
	y: number;
}

/**
 * Applies viewport position updates through a single commit path.
 */
export default function updateViewport(state: State, x: number, y: number, events?: EventDispatcher): boolean {
	const previousX = state.viewport.x;
	const previousY = state.viewport.y;

	state.viewport.x = x;
	state.viewport.y = y;
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
