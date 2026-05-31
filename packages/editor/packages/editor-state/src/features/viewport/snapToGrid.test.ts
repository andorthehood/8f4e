import { describe, expect, it } from 'vitest';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import snapToGrid from './snapToGrid';

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
