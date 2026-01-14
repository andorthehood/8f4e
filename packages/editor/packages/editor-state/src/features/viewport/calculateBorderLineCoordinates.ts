import type { State } from '~/types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

export default function calculateBorderLineCoordinates(state: State): void {
	const viewport = state.graphicHelper.viewport;
	const { borderLineCoordinates, center, x, y, width, height } = viewport;

	borderLineCoordinates.left.startX = x;
	borderLineCoordinates.left.startY = y;
	borderLineCoordinates.left.endX = x;
	borderLineCoordinates.left.endY = y + height;

	borderLineCoordinates.top.startX = x;
	borderLineCoordinates.top.startY = y;
	borderLineCoordinates.top.endX = x + width;
	borderLineCoordinates.top.endY = y;

	borderLineCoordinates.right.startX = x + width;
	borderLineCoordinates.right.startY = y;
	borderLineCoordinates.right.endX = x + width;
	borderLineCoordinates.right.endY = y + height;

	borderLineCoordinates.bottom.startX = x;
	borderLineCoordinates.bottom.startY = y + height;
	borderLineCoordinates.bottom.endX = x + width;
	borderLineCoordinates.bottom.endY = y + height;

	center.x = x + Math.round(width / 2);
	center.y = y + Math.round(height / 2);
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('calculateBorderLineCoordinates', () => {
		it('updates every border coordinate and center point', () => {
			const state = createMockState({
				graphicHelper: {
					viewport: {
						x: 10,
						y: 20,
						width: 120,
						height: 60,
					},
				},
			});

			calculateBorderLineCoordinates(state);

			const { borderLineCoordinates, center } = state.graphicHelper.viewport;
			expect(borderLineCoordinates.left).toEqual({ startX: 10, startY: 20, endX: 10, endY: 80 });
			expect(borderLineCoordinates.top).toEqual({ startX: 10, startY: 20, endX: 130, endY: 20 });
			expect(borderLineCoordinates.right).toEqual({ startX: 130, startY: 20, endX: 130, endY: 80 });
			expect(borderLineCoordinates.bottom).toEqual({ startX: 10, startY: 80, endX: 130, endY: 80 });
			expect(center).toEqual({ x: 70, y: 50 });
		});
	});
}
