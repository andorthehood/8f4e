import { describe, expect, it } from 'vitest';

import updateViewport from './updateViewport';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

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

		updateViewport(state, 24, 40, events);

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

		updateViewport(state, state.viewport.x, state.viewport.y, events);

		expect(events.dispatch).not.toHaveBeenCalled();
	});
});
