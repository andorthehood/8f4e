/**
 * Grid-space bounds of a code block.
 */
export interface GridRect {
	gridX: number;
	gridY: number;
	gridWidth: number;
	gridHeight: number;
}

/**
 * Returns true if a block placed at (x, y) with the given dimensions overlaps any of
 * the provided existing rectangles.
 */
export function hasCollision(existingRects: GridRect[], x: number, y: number, w: number, h: number): boolean {
	for (const rect of existingRects) {
		const xOverlap = x < rect.gridX + rect.gridWidth && x + w > rect.gridX;
		const yOverlap = y < rect.gridY + rect.gridHeight && y + h > rect.gridY;
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
 * @param existingRects - Grid-space bounds of all existing blocks
 * @param targetWidth - Target block width in grid units
 * @param targetHeight - Target block height in grid units
 * @returns The first free grid coordinate {x, y} for placement
 */
export default function findFreeSpace(
	existingRects: GridRect[],
	targetWidth: number,
	targetHeight: number
): { x: number; y: number } {
	for (let y = 0; ; y++) {
		if (!hasCollision(existingRects, 0, y, targetWidth, targetHeight)) {
			return { x: 0, y };
		}
	}
}
