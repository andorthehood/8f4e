import findClosestCodeBlockInDirection from './findClosestCodeBlockInDirection';

import type { CodeBlockGraphicData } from '../types';

/**
 * Helper function to create a mock CodeBlockGraphicData object for testing
 */
function createMockCodeBlock(
	id: string,
	x: number,
	y: number,
	width = 100,
	height = 100,
	offsetX = 0,
	offsetY = 0
): CodeBlockGraphicData {
	return {
		id,
		x,
		y,
		width,
		height,
		offsetX,
		offsetY,
		minGridWidth: 32,
		code: [],
		trimmedCode: [],
		codeColors: [],
		codeToRender: [],
		cursor: { col: 0, row: 0, x: 0, y: 0 },
		gaps: new Map(),
		gridX: 0,
		gridY: 0,
		isOpen: true,
		padLength: 1,
		viewport: { x: 0, y: 0 },
		codeBlocks: new Set(),
		extras: {
			inputs: new Map(),
			outputs: new Map(),
			debuggers: new Map(),
			switches: new Map(),
			buttons: new Map(),
			pianoKeyboards: new Map(),
			bufferPlotters: new Map(),
			errorMessages: new Map(),
		},
		lastUpdated: Date.now(),
	} as CodeBlockGraphicData;
}

describe('findClosestCodeBlockInDirection', () => {
	describe('right direction', () => {
		it('should find the closest block to the right', () => {
			const selected = createMockCodeBlock('selected', 0, 0);
			const right1 = createMockCodeBlock('right1', 200, 0);
			const right2 = createMockCodeBlock('right2', 400, 0);
			const codeBlocks = new Set([selected, right1, right2]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('right1');
		});

		it('should prefer aligned blocks over closer misaligned blocks', () => {
			const selected = createMockCodeBlock('selected', 0, 0);
			const closeButMisaligned = createMockCodeBlock('close', 150, 200); // Closer but far vertically
			const alignedButFarther = createMockCodeBlock('aligned', 300, 10); // Farther but more aligned
			const codeBlocks = new Set([selected, closeButMisaligned, alignedButFarther]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			// The algorithm should balance distance and alignment
			// With ALIGNMENT_WEIGHT = 1.0:
			// close: primaryDistance=150, secondaryDistance=200, score=350
			// aligned: primaryDistance=300, secondaryDistance=10, score=310
			expect(result.id).toBe('aligned');
		});

		it('should return selected block if no blocks to the right', () => {
			const selected = createMockCodeBlock('selected', 100, 0);
			const left = createMockCodeBlock('left', 0, 0);
			const codeBlocks = new Set([selected, left]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('selected');
		});
	});

	describe('left direction', () => {
		it('should find the closest block to the left', () => {
			const selected = createMockCodeBlock('selected', 400, 0);
			const left1 = createMockCodeBlock('left1', 200, 0);
			const left2 = createMockCodeBlock('left2', 0, 0);
			const codeBlocks = new Set([selected, left1, left2]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'left');

			expect(result.id).toBe('left1');
		});

		it('should return selected block if no blocks to the left', () => {
			const selected = createMockCodeBlock('selected', 0, 0);
			const right = createMockCodeBlock('right', 200, 0);
			const codeBlocks = new Set([selected, right]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'left');

			expect(result.id).toBe('selected');
		});
	});

	describe('up direction', () => {
		it('should find the closest block above', () => {
			const selected = createMockCodeBlock('selected', 0, 400);
			const up1 = createMockCodeBlock('up1', 0, 200);
			const up2 = createMockCodeBlock('up2', 0, 0);
			const codeBlocks = new Set([selected, up1, up2]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'up');

			expect(result.id).toBe('up1');
		});

		it('should prefer aligned blocks over closer misaligned blocks', () => {
			const selected = createMockCodeBlock('selected', 0, 400);
			const closeButMisaligned = createMockCodeBlock('close', 200, 250); // Closer but far horizontally
			const alignedButFarther = createMockCodeBlock('aligned', 10, 100); // Farther but more aligned
			const codeBlocks = new Set([selected, closeButMisaligned, alignedButFarther]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'up');

			// With ALIGNMENT_WEIGHT = 1.0:
			// close: primaryDistance=150, secondaryDistance=200, score=350
			// aligned: primaryDistance=300, secondaryDistance=10, score=310
			expect(result.id).toBe('aligned');
		});

		it('should return selected block if no blocks above', () => {
			const selected = createMockCodeBlock('selected', 0, 0);
			const down = createMockCodeBlock('down', 0, 200);
			const codeBlocks = new Set([selected, down]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'up');

			expect(result.id).toBe('selected');
		});
	});

	describe('down direction', () => {
		it('should find the closest block below', () => {
			const selected = createMockCodeBlock('selected', 0, 0);
			const down1 = createMockCodeBlock('down1', 0, 200);
			const down2 = createMockCodeBlock('down2', 0, 400);
			const codeBlocks = new Set([selected, down1, down2]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'down');

			expect(result.id).toBe('down1');
		});

		it('should return selected block if no blocks below', () => {
			const selected = createMockCodeBlock('selected', 0, 200);
			const up = createMockCodeBlock('up', 0, 0);
			const codeBlocks = new Set([selected, up]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'down');

			expect(result.id).toBe('selected');
		});
	});

	describe('edge cases', () => {
		it('should handle only the selected block', () => {
			const selected = createMockCodeBlock('selected', 0, 0);
			const codeBlocks = new Set([selected]);

			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'right').id).toBe('selected');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'left').id).toBe('selected');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'up').id).toBe('selected');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'down').id).toBe('selected');
		});

		it('should handle empty set by returning selected block', () => {
			const selected = createMockCodeBlock('selected', 0, 0);
			const codeBlocks = new Set<CodeBlockGraphicData>();
			codeBlocks.add(selected);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('selected');
		});

		it('should handle blocks with offsets', () => {
			const selected = createMockCodeBlock('selected', 0, 0, 100, 100, 10, 10);
			const right = createMockCodeBlock('right', 200, 0, 100, 100, 20, 20);
			const codeBlocks = new Set([selected, right]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('right');
		});

		it('should handle overlapping positions', () => {
			const selected = createMockCodeBlock('selected', 100, 100);
			const overlap = createMockCodeBlock('overlap', 100, 100);
			const right = createMockCodeBlock('right', 300, 100);
			const codeBlocks = new Set([selected, overlap, right]);

			// Even though overlap is at same position, center calculation means it won't be selected
			// when looking right, the 'right' block should be found
			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('right');
		});

		it('should use center points for distance calculation', () => {
			// Test that blocks are compared using their center points
			const selected = createMockCodeBlock('selected', 0, 0, 100, 100); // center at (50, 50)
			const right = createMockCodeBlock('right', 150, 0, 100, 100); // center at (200, 50)
			const codeBlocks = new Set([selected, right]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('right');
		});

		it('should handle blocks with different dimensions', () => {
			const selected = createMockCodeBlock('selected', 0, 0, 50, 50);
			const largeRight = createMockCodeBlock('largeRight', 200, 0, 200, 200);
			const smallRight = createMockCodeBlock('smallRight', 400, 0, 25, 25);
			const codeBlocks = new Set([selected, largeRight, smallRight]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('largeRight');
		});
	});

	describe('complex scenarios', () => {
		it('should handle a grid of blocks correctly', () => {
			// Create a 3x3 grid of blocks
			const selected = createMockCodeBlock('center', 200, 200);
			const topLeft = createMockCodeBlock('topLeft', 0, 0);
			const top = createMockCodeBlock('top', 200, 0);
			const topRight = createMockCodeBlock('topRight', 400, 0);
			const left = createMockCodeBlock('left', 0, 200);
			const right = createMockCodeBlock('right', 400, 200);
			const bottomLeft = createMockCodeBlock('bottomLeft', 0, 400);
			const bottom = createMockCodeBlock('bottom', 200, 400);
			const bottomRight = createMockCodeBlock('bottomRight', 400, 400);

			const codeBlocks = new Set([selected, topLeft, top, topRight, left, right, bottomLeft, bottom, bottomRight]);

			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'up').id).toBe('top');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'down').id).toBe('bottom');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'left').id).toBe('left');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'right').id).toBe('right');
		});

		it('should handle when multiple blocks are at equal distance', () => {
			const selected = createMockCodeBlock('selected', 200, 200);
			const right1 = createMockCodeBlock('right1', 400, 200);
			const right2 = createMockCodeBlock('right2', 400, 200);
			const codeBlocks = new Set([selected, right1, right2]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			// Should return one of them deterministically (first found)
			expect(['right1', 'right2']).toContain(result.id);
		});
	});

	describe('all four directions independently', () => {
		it('should navigate in all four directions from a central block', () => {
			const selected = createMockCodeBlock('selected', 200, 200);
			const up = createMockCodeBlock('up', 200, 0);
			const down = createMockCodeBlock('down', 200, 400);
			const left = createMockCodeBlock('left', 0, 200);
			const right = createMockCodeBlock('right', 400, 200);
			const codeBlocks = new Set([selected, up, down, left, right]);

			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'up').id).toBe('up');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'down').id).toBe('down');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'left').id).toBe('left');
			expect(findClosestCodeBlockInDirection(codeBlocks, selected, 'right').id).toBe('right');
		});
	});
});
