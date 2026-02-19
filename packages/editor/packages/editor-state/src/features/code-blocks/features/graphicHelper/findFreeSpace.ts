import type { CodeBlockGraphicData } from '~/types';

type PlacedBlock = Pick<CodeBlockGraphicData, 'gridX' | 'gridY' | 'gridWidth' | 'code'>;

/**
 * Returns true if a block placed at (x, y) with the given dimensions overlaps any of
 * the provided existing blocks.
 */
export function hasCollision(existingBlocks: PlacedBlock[], x: number, y: number, w: number, h: number): boolean {
	for (const block of existingBlocks) {
		const xOverlap = x < block.gridX + block.gridWidth && x + w > block.gridX;
		const yOverlap = y < block.gridY + block.code.length && y + h > block.gridY;
		if (xOverlap && yOverlap) {
			return true;
		}
	}
	return false;
}

/**
 * Scans grid space starting from (0, 0), increasing Y row-by-row, and returns the first
 * grid coordinate where a block of the given dimensions does not overlap any existing block.
 *
 * @param existingBlocks - Existing placed blocks to check against
 * @param targetWidth - Target block width in grid units
 * @param targetHeight - Target block height in grid units (number of code lines)
 * @returns The first free grid coordinate {x, y} for placement
 */
export default function findFreeSpace(
	existingBlocks: PlacedBlock[],
	targetWidth: number,
	targetHeight: number
): { x: number; y: number } {
	for (let y = 0; ; y++) {
		if (!hasCollision(existingBlocks, 0, y, targetWidth, targetHeight)) {
			return { x: 0, y };
		}
	}
}
