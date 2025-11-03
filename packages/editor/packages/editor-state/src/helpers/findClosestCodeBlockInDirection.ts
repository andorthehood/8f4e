/**
 * Direction types for navigation
 */
export type Direction = 'left' | 'right' | 'up' | 'down';

/**
 * Minimal positional data required for spatial navigation
 */
export interface CodeBlockPosition {
	x: number;
	y: number;
	width: number;
	height: number;
	offsetX: number;
	offsetY: number;
}

/**
 * Weight factor for alignment preference in distance calculation.
 * Higher values make alignment more important than pure distance.
 * A value of 2.0 strongly favors aligned blocks over closer misaligned ones.
 */
const ALIGNMENT_WEIGHT = 2.0;

/**
 * Calculate the absolute position boundaries of a code block including offsets.
 */
function getBlockBounds(block: CodeBlockPosition) {
	const left = block.x + block.offsetX;
	const top = block.y + block.offsetY;
	const right = left + block.width;
	const bottom = top + block.height;
	return { left, top, right, bottom };
}

/**
 * Calculate edge-to-edge distance along the primary axis of movement.
 * For 'down': distance from selected bottom edge to candidate top edge
 * For 'up': distance from candidate bottom edge to selected top edge
 * For 'right': distance from selected right edge to candidate left edge
 * For 'left': distance from candidate right edge to selected left edge
 */
function calculatePrimaryDistance(
	selectedBounds: ReturnType<typeof getBlockBounds>,
	candidateBounds: ReturnType<typeof getBlockBounds>,
	direction: Direction
): number {
	switch (direction) {
		case 'down':
			return candidateBounds.top - selectedBounds.bottom;
		case 'up':
			return selectedBounds.top - candidateBounds.bottom;
		case 'right':
			return candidateBounds.left - selectedBounds.right;
		case 'left':
			return selectedBounds.left - candidateBounds.right;
	}
}

/**
 * Calculate the perpendicular offset between blocks (for alignment scoring).
 * For vertical movement: measures horizontal offset between block centers
 * For horizontal movement: measures vertical offset between block centers
 * This helps prefer blocks that are better aligned on the perpendicular axis.
 */
function calculateSecondaryDistance(
	selectedBounds: ReturnType<typeof getBlockBounds>,
	candidateBounds: ReturnType<typeof getBlockBounds>,
	direction: Direction
): number {
	if (direction === 'up' || direction === 'down') {
		// For vertical movement, measure horizontal alignment
		const selectedCenterX = (selectedBounds.left + selectedBounds.right) / 2;
		const candidateCenterX = (candidateBounds.left + candidateBounds.right) / 2;
		return Math.abs(candidateCenterX - selectedCenterX);
	} else {
		// For horizontal movement, measure vertical alignment
		const selectedCenterY = (selectedBounds.top + selectedBounds.bottom) / 2;
		const candidateCenterY = (candidateBounds.top + candidateBounds.bottom) / 2;
		return Math.abs(candidateCenterY - selectedCenterY);
	}
}

/**
 * Finds the closest code block in a specified direction from the currently selected code block.
 *
 * This function uses an edge-based spatial navigation algorithm that:
 * - Filters code blocks based on edge-to-edge directional criteria
 * - Calculates edge-to-edge distance along the primary axis of movement
 * - Weights alignment on the perpendicular axis to prefer visually aligned blocks
 * - Returns the selected block if no other blocks exist in that direction
 *
 * Edge-based distance means:
 * - For 'down': measures from bottom edge of selected to top edge of candidates
 * - For 'up': measures from top edge of selected to bottom edge of candidates
 * - For 'right': measures from right edge of selected to left edge of candidates
 * - For 'left': measures from left edge of selected to right edge of candidates
 *
 * This approach provides more intuitive navigation, especially in staggered or
 * diagonal layouts, by preferring blocks that are truly in the requested direction
 * rather than just diagonally closer by center-to-center distance.
 *
 * @param codeBlocks - The set of all code blocks to search through
 * @param selectedBlock - The currently selected code block to navigate from
 * @param direction - The direction to navigate: 'left', 'right', 'up', or 'down'
 * @returns The closest code block in the specified direction, or the selected block if none found
 *
 * @example
 * ```typescript
 * const closestBlock = findClosestCodeBlockInDirection(
 *   graphicHelper.activeViewport.codeBlocks,
 *   graphicHelper.selectedCodeBlock,
 *   'right'
 * );
 * ```
 */
export default function findClosestCodeBlockInDirection<T extends CodeBlockPosition>(
	codeBlocks: Set<T>,
	selectedBlock: T,
	direction: Direction
): T {
	const selectedBounds = getBlockBounds(selectedBlock);

	// Filter candidates based on direction using edge-based comparison
	const candidates = Array.from(codeBlocks).filter(block => {
		if (block === selectedBlock) return false;

		const candidateBounds = getBlockBounds(block);

		switch (direction) {
			case 'left':
				return candidateBounds.right <= selectedBounds.left;
			case 'right':
				return candidateBounds.left >= selectedBounds.right;
			case 'up':
				return candidateBounds.bottom <= selectedBounds.top;
			case 'down':
				return candidateBounds.top >= selectedBounds.bottom;
		}
	});

	// If no candidates found, return the selected block
	if (candidates.length === 0) {
		return selectedBlock;
	}

	// Find the closest candidate using edge-based weighted distance
	let closestBlock = candidates[0];
	let minScore = Infinity;

	for (const candidate of candidates) {
		const candidateBounds = getBlockBounds(candidate);

		// Calculate edge-to-edge primary distance and perpendicular alignment
		const primaryDistance = calculatePrimaryDistance(selectedBounds, candidateBounds, direction);
		const secondaryDistance = calculateSecondaryDistance(selectedBounds, candidateBounds, direction);

		// Calculate weighted score - lower is better
		// Alignment (secondary distance) is weighted to strongly prefer aligned blocks
		const score = primaryDistance + secondaryDistance * ALIGNMENT_WEIGHT;

		if (score < minScore) {
			minScore = score;
			closestBlock = candidate;
		}
	}

	return closestBlock;
}
