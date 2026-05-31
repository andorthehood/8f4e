import { describe, expect, it } from 'vitest';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import snapToGridConsideringDirection from './snapToGridConsideringDirection';

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

		const position = snapToGridConsideringDirection(state, { movementY: 1 });

		expect(position.y).toBe(32);
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

		const position = snapToGridConsideringDirection(state, { movementY: -1 });

		expect(position.y).toBe(48);
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

		const position = snapToGridConsideringDirection(state, { movementX: 1, movementY: -1 });

		expect(position).toEqual({ x: 32, y: 48 });
	});
});
