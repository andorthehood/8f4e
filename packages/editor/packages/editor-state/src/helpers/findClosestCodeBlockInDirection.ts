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
 * A value of 1.0 means alignment and distance are weighted equally.
 */
const ALIGNMENT_WEIGHT = 1.0;

/**
 * Finds the closest code block in a specified direction from the currently selected code block.
 *
 * This function uses a spatial navigation algorithm that:
 * - Filters code blocks based on directional criteria
 * - Calculates weighted distance prioritizing alignment over pure distance
 * - Returns the selected block if no other blocks exist in that direction
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
	// Calculate the center point of the selected block (accounting for offsets)
	const selectedX = selectedBlock.x + selectedBlock.offsetX + selectedBlock.width / 2;
	const selectedY = selectedBlock.y + selectedBlock.offsetY + selectedBlock.height / 2;

	// Filter candidates based on direction
	const candidates = Array.from(codeBlocks).filter(block => {
		if (block === selectedBlock) return false;

		const blockX = block.x + block.offsetX + block.width / 2;
		const blockY = block.y + block.offsetY + block.height / 2;

		switch (direction) {
			case 'left':
				return blockX < selectedX;
			case 'right':
				return blockX > selectedX;
			case 'up':
				return blockY < selectedY;
			case 'down':
				return blockY > selectedY;
		}
	});

	// If no candidates found, return the selected block
	if (candidates.length === 0) {
		return selectedBlock;
	}

	// Find the closest candidate using weighted distance
	let closestBlock = candidates[0];
	let minScore = Infinity;

	for (const candidate of candidates) {
		const candidateX = candidate.x + candidate.offsetX + candidate.width / 2;
		const candidateY = candidate.y + candidate.offsetY + candidate.height / 2;

		// Calculate primary and secondary distances based on direction
		let primaryDistance: number;
		let secondaryDistance: number;

		if (direction === 'left' || direction === 'right') {
			// For horizontal movement, primary is horizontal distance
			primaryDistance = Math.abs(candidateX - selectedX);
			secondaryDistance = Math.abs(candidateY - selectedY);
		} else {
			// For vertical movement, primary is vertical distance
			primaryDistance = Math.abs(candidateY - selectedY);
			secondaryDistance = Math.abs(candidateX - selectedX);
		}

		// Calculate weighted score - lower is better
		// Alignment (secondary distance) is weighted to prefer aligned blocks
		const score = primaryDistance + secondaryDistance * ALIGNMENT_WEIGHT;

		if (score < minScore) {
			minScore = score;
			closestBlock = candidate;
		}
	}

	return closestBlock;
}
