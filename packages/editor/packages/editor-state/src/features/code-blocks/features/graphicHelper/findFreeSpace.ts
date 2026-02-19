import type { CodeBlockGraphicData } from '~/types';

type PlacedBlock = Pick<CodeBlockGraphicData, 'gridX' | 'gridY' | 'gridWidth' | 'gridHeight'>;

/**
 * Returns true if a block placed at (x, y) with the given dimensions overlaps any of
 * the provided existing blocks.
 */
export function hasCollision(existingBlocks: PlacedBlock[], x: number, y: number, w: number, h: number): boolean {
	for (const block of existingBlocks) {
		const xOverlap = x < block.gridX + block.gridWidth && x + w > block.gridX;
		const yOverlap = y < block.gridY + block.gridHeight && y + h > block.gridY;
		if (xOverlap && yOverlap) {
			return true;
		}
	}
	return false;
}

/**
 * Scans grid space starting from (0, 0) and returns the first grid coordinate where a block
 * of the given dimensions does not overlap any existing block.
 *
 * Instead of scanning row-by-row, candidate Y positions are derived from the bottom edges
 * of horizontally-overlapping blocks, making the algorithm O(n log n) rather than O(y * n).
 *
 * @param existingBlocks - Existing placed blocks to check against
 * @param targetWidth - Target block width in grid units
 * @param targetHeight - Target block height in grid units (including gap rows)
 * @returns The first free grid coordinate {x, y} for placement
 */
export default function findFreeSpace(
	existingBlocks: PlacedBlock[],
	targetWidth: number,
	targetHeight: number
): { x: number; y: number } {
	// Only consider blocks that horizontally overlap [0, targetWidth)
	const horizontallyOverlapping = existingBlocks.filter(
		block => 0 < block.gridX + block.gridWidth && targetWidth > block.gridX
	);

	// Candidate Y positions: 0 and the bottom edge of each overlapping block
	const candidateYs = [0, ...horizontallyOverlapping.map(block => block.gridY + block.gridHeight)];
	candidateYs.sort((a, b) => a - b);

	for (const y of candidateYs) {
		if (y >= 0 && !hasCollision(existingBlocks, 0, y, targetWidth, targetHeight)) {
			return { x: 0, y };
		}
	}

	// Fallback: place just below all overlapping blocks (guaranteed to be free)
	const maxBottom = horizontallyOverlapping.reduce((max, block) => Math.max(max, block.gridY + block.gridHeight), 0);
	return { x: 0, y: maxBottom };
}
