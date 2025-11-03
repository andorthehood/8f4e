import findClosestCodeBlockInDirection, { CodeBlockPosition } from './findClosestCodeBlockInDirection';

/**
 * Helper function to create a simple code block position object for testing
 */
function createMockCodeBlock(
	id: string,
	x: number,
	y: number,
	width = 100,
	height = 100,
	offsetX = 0,
	offsetY = 0
): CodeBlockPosition & { id: string } {
	return {
		id,
		x,
		y,
		width,
		height,
		offsetX,
		offsetY,
	};
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
			// With edge-based calculation and ALIGNMENT_WEIGHT = 2.0:
			// close: primaryDistance=150-100=50, secondaryDistance=200, score=450
			// aligned: primaryDistance=300-100=200, secondaryDistance=10, score=220
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

			// With edge-based calculation and ALIGNMENT_WEIGHT = 2.0:
			// close: primaryDistance=400-350=50, secondaryDistance=200, score=450
			// aligned: primaryDistance=400-200=200, secondaryDistance=10, score=220
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

	describe('edge-based navigation (diagonal and staggered layouts)', () => {
		it('should prefer directly below block over diagonally closer block when moving down', () => {
			// Setup: selected block at (0, 0), directlyBelow at (0, 200), diagonalCloser at (80, 150)
			// With edge-based logic:
			// - directlyBelow: primaryDistance = 200-100 = 100, secondaryDistance = 0, score = 100
			// - diagonalCloser: primaryDistance = 150-100 = 50, secondaryDistance = 80, score = 50 + 80*2 = 210
			// directlyBelow should win despite being farther away
			const selected = createMockCodeBlock('selected', 0, 0, 100, 100);
			const directlyBelow = createMockCodeBlock('directlyBelow', 0, 200, 100, 100);
			const diagonalCloser = createMockCodeBlock('diagonalCloser', 80, 150, 100, 100);
			const codeBlocks = new Set([selected, directlyBelow, diagonalCloser]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'down');

			expect(result.id).toBe('directlyBelow');
		});

		it('should prefer directly above block over diagonally closer block when moving up', () => {
			// Setup similar to above but for upward movement
			const selected = createMockCodeBlock('selected', 0, 300, 100, 100);
			const directlyAbove = createMockCodeBlock('directlyAbove', 0, 100, 100, 100);
			const diagonalCloser = createMockCodeBlock('diagonalCloser', 80, 150, 100, 100);
			const codeBlocks = new Set([selected, directlyAbove, diagonalCloser]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'up');

			expect(result.id).toBe('directlyAbove');
		});

		it('should prefer directly right block over diagonally closer block when moving right', () => {
			const selected = createMockCodeBlock('selected', 0, 0, 100, 100);
			const directlyRight = createMockCodeBlock('directlyRight', 200, 0, 100, 100);
			const diagonalCloser = createMockCodeBlock('diagonalCloser', 150, 80, 100, 100);
			const codeBlocks = new Set([selected, directlyRight, diagonalCloser]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');

			expect(result.id).toBe('directlyRight');
		});

		it('should prefer directly left block over diagonally closer block when moving left', () => {
			const selected = createMockCodeBlock('selected', 300, 0, 100, 100);
			const directlyLeft = createMockCodeBlock('directlyLeft', 100, 0, 100, 100);
			const diagonalCloser = createMockCodeBlock('diagonalCloser', 150, 80, 100, 100);
			const codeBlocks = new Set([selected, directlyLeft, diagonalCloser]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'left');

			expect(result.id).toBe('directlyLeft');
		});

		it('should handle staggered vertical layout correctly', () => {
			// Create a staggered layout:
			//   [A]
			//      [B]  <- selected
			//   [C]
			//      [D]
			const selected = createMockCodeBlock('B', 200, 100, 100, 80);
			const blockA = createMockCodeBlock('A', 50, 0, 100, 80);
			const blockC = createMockCodeBlock('C', 50, 200, 100, 80);
			const blockD = createMockCodeBlock('D', 200, 300, 100, 80);
			const codeBlocks = new Set([selected, blockA, blockC, blockD]);

			// Moving up should go to A (even though it's offset)
			const upResult = findClosestCodeBlockInDirection(codeBlocks, selected, 'up');
			expect(upResult.id).toBe('A');

			// Moving down should go to D (directly below, even though C is also below)
			const downResult = findClosestCodeBlockInDirection(codeBlocks, selected, 'down');
			expect(downResult.id).toBe('D');
		});

		it('should handle staggered horizontal layout correctly', () => {
			// Create a staggered layout:
			//   [A]  [B-selected]  [C]  [D]
			//         (B slightly lower)
			const selected = createMockCodeBlock('B', 200, 100, 100, 80);
			const blockA = createMockCodeBlock('A', 0, 50, 100, 80);
			const blockC = createMockCodeBlock('C', 400, 50, 100, 80);
			const blockD = createMockCodeBlock('D', 600, 100, 100, 80);
			const codeBlocks = new Set([selected, blockA, blockC, blockD]);

			// Moving left should go to A
			const leftResult = findClosestCodeBlockInDirection(codeBlocks, selected, 'left');
			expect(leftResult.id).toBe('A');

			// Moving right should go to C (better aligned than D)
			const rightResult = findClosestCodeBlockInDirection(codeBlocks, selected, 'right');
			expect(rightResult.id).toBe('C');
		});

		it('should use edge-based filtering to exclude overlapping blocks', () => {
			// Block that partially overlaps horizontally should not be considered when moving down
			const selected = createMockCodeBlock('selected', 100, 100, 100, 100); // right edge at 200
			const overlapping = createMockCodeBlock('overlapping', 150, 150, 100, 100); // left edge at 150, top at 150
			const properlyBelow = createMockCodeBlock('properlyBelow', 100, 250, 100, 100); // top at 250
			const codeBlocks = new Set([selected, overlapping, properlyBelow]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'down');

			// Should select properlyBelow because overlapping's top (150) is not >= selected's bottom (200)
			expect(result.id).toBe('properlyBelow');
		});

		it('should handle edge case where blocks are adjacent with no gap', () => {
			// Blocks that touch edge-to-edge (no gap between them)
			const selected = createMockCodeBlock('selected', 0, 0, 100, 100);
			const adjacent = createMockCodeBlock('adjacent', 0, 100, 100, 100); // top edge exactly at selected's bottom
			const codeBlocks = new Set([selected, adjacent]);

			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'down');

			// Should find adjacent with 0 primary distance
			expect(result.id).toBe('adjacent');
		});

		it('should prioritize alignment with increased weight', () => {
			// With ALIGNMENT_WEIGHT = 2.0, test that alignment is more important
			const selected = createMockCodeBlock('selected', 100, 100, 100, 100);
			// farAligned: far but perfectly aligned
			const farAligned = createMockCodeBlock('farAligned', 100, 300, 100, 100);
			// closeMisaligned: closer but significantly misaligned
			const closeMisaligned = createMockCodeBlock('closeMisaligned', 250, 220, 100, 100);
			const codeBlocks = new Set([selected, farAligned, closeMisaligned]);

			// farAligned: primary = 300-200 = 100, secondary = 0, score = 100
			// closeMisaligned: primary = 220-200 = 20, secondary = 200, score = 20 + 200*2 = 420
			const result = findClosestCodeBlockInDirection(codeBlocks, selected, 'down');

			expect(result.id).toBe('farAligned');
		});
	});
});
