import type { CodeBlockGraphicData } from '../../types';

/**
 * Direction types for navigation
 */
export type Direction = 'left' | 'right' | 'up' | 'down';

/**
 * Weight factor for alignment preference in distance calculation.
 * Higher values make alignment more important than pure distance.
 * A value of 2.0 strongly favors aligned blocks over closer misaligned ones.
 */
const ALIGNMENT_WEIGHT = 2.0;

/**
 * Calculate the absolute position boundaries of a code block including offsets.
 */
function getBlockBounds(block: CodeBlockGraphicData) {
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
 *
 * Returns a non-negative distance. Negative values (which would indicate overlapping blocks)
 * are clamped to 0 as a defensive measure, though the filtering logic should already exclude such cases.
 */
function calculatePrimaryDistance(
	selectedBounds: ReturnType<typeof getBlockBounds>,
	candidateBounds: ReturnType<typeof getBlockBounds>,
	direction: Direction
): number {
	let distance: number;
	switch (direction) {
		case 'down':
			distance = candidateBounds.top - selectedBounds.bottom;
			break;
		case 'up':
			distance = selectedBounds.top - candidateBounds.bottom;
			break;
		case 'right':
			distance = candidateBounds.left - selectedBounds.right;
			break;
		case 'left':
			distance = selectedBounds.left - candidateBounds.right;
			break;
		default: {
			// Exhaustiveness check: if we get here, TypeScript will error if a direction is missing
			const exhaustiveCheck: never = direction;
			throw new Error(`Unhandled direction: ${exhaustiveCheck}`);
		}
	}
	return Math.max(0, distance);
}

/**
 * Calculate the perpendicular offset between blocks (for alignment scoring).
 * For vertical movement: measures horizontal offset between block centers
 * For horizontal movement: measures vertical offset from cursor to candidate block,
 * prioritizing blocks that overlap with the cursor's Y position.
 * This helps prefer blocks that are better aligned on the perpendicular axis.
 */
function calculateSecondaryDistance(
	selectedBlock: CodeBlockGraphicData,
	selectedBounds: ReturnType<typeof getBlockBounds>,
	candidateBounds: ReturnType<typeof getBlockBounds>,
	direction: Direction
): number {
	switch (direction) {
		case 'up':
		case 'down': {
			const selectedCenterX = (selectedBounds.left + selectedBounds.right) / 2;
			const candidateCenterX = (candidateBounds.left + candidateBounds.right) / 2;
			return Math.abs(candidateCenterX - selectedCenterX);
		}
		case 'left':
		case 'right': {
			const cursorY = selectedBlock.cursor.y;

			if (cursorY >= candidateBounds.top && cursorY <= candidateBounds.bottom) {
				return 0;
			}

			if (cursorY < candidateBounds.top) {
				return candidateBounds.top - cursorY;
			} else {
				return cursorY - candidateBounds.bottom;
			}
		}
		default: {
			// Exhaustiveness check: if we get here, TypeScript will error if a direction is missing
			const exhaustiveCheck: never = direction;
			throw new Error(`Unhandled direction: ${exhaustiveCheck}`);
		}
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
 * @param codeBlocks - The list of all code blocks to search through
 * @param selectedBlock - The currently selected code block to navigate from
 * @param direction - The direction to navigate: 'left', 'right', 'up', or 'down'
 * @returns The closest code block in the specified direction, or the selected block if none found
 *
 * @example
 * ```typescript
 * const closestBlock = findClosestCodeBlockInDirection(
 *   graphicHelper.codeBlocks,
 *   graphicHelper.selectedCodeBlock,
 *   'right'
 * );
 * ```
 */
export default function findClosestCodeBlockInDirection(
	codeBlocks: CodeBlockGraphicData[],
	selectedBlock: CodeBlockGraphicData,
	direction: Direction
): CodeBlockGraphicData {
	const selectedBounds = getBlockBounds(selectedBlock);

	const candidates = codeBlocks.filter(block => {
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

	if (candidates.length === 0) {
		return selectedBlock;
	}

	let closestBlock = candidates[0];
	let minDistance = Infinity;

	for (const candidate of candidates) {
		const candidateBounds = getBlockBounds(candidate);

		let distance: number;

		switch (direction) {
			case 'left':
			case 'right': {
				const absoluteCursorY = selectedBounds.top + selectedBlock.cursor.y;
				const candidateTop = candidateBounds.top;
				const candidateBottom = candidateBounds.bottom;

				if (absoluteCursorY >= candidateTop && absoluteCursorY <= candidateBottom) {
					distance = calculatePrimaryDistance(selectedBounds, candidateBounds, direction);
				} else {
					distance = Infinity;
				}
				break;
			}
			case 'up':
			case 'down': {
				const primaryDistance = calculatePrimaryDistance(selectedBounds, candidateBounds, direction);
				const secondaryDistance = calculateSecondaryDistance(selectedBlock, selectedBounds, candidateBounds, direction);
				distance = primaryDistance + secondaryDistance * ALIGNMENT_WEIGHT;
				break;
			}
		}

		if (distance < minDistance) {
			minDistance = distance;
			closestBlock = candidate;
		}
	}

	if ((direction === 'left' || direction === 'right') && minDistance === Infinity) {
		return selectedBlock;
	}

	return closestBlock;
}
