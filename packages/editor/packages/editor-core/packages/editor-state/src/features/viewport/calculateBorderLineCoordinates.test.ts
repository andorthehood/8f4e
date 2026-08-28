import { describe, expect, it } from 'vitest';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import calculateBorderLineCoordinates from './calculateBorderLineCoordinates';

describe('calculateBorderLineCoordinates', () => {
	it('updates every border coordinate and center point', () => {
		const state = createMockState({
			viewport: {
				x: 10,
				y: 20,
				width: 120,
				height: 60,
			},
		});

		calculateBorderLineCoordinates(state);

		const { borderLineCoordinates, center } = state.viewport;
		expect(borderLineCoordinates.left).toEqual({ startX: 10, startY: 20, endX: 10, endY: 80 });
		expect(borderLineCoordinates.top).toEqual({ startX: 10, startY: 20, endX: 130, endY: 20 });
		expect(borderLineCoordinates.right).toEqual({ startX: 130, startY: 20, endX: 130, endY: 80 });
		expect(borderLineCoordinates.bottom).toEqual({ startX: 10, startY: 80, endX: 130, endY: 80 });
		expect(center).toEqual({ x: 70, y: 50 });
	});

	it('uses raw viewport dimensions rather than rounded dimensions', () => {
		const state = createMockState({
			viewport: {
				x: 10,
				y: 20,
				width: 125,
				height: 63,
				roundedWidth: 120,
				roundedHeight: 48,
			},
		});

		calculateBorderLineCoordinates(state);

		const { borderLineCoordinates, center } = state.viewport;
		expect(borderLineCoordinates.right.startX).toBe(135);
		expect(borderLineCoordinates.bottom.startY).toBe(83);
		expect(center).toEqual({ x: 73, y: 52 });
	});
});
