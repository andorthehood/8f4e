import type { CodeBlockGraphicData } from '~/types';

import getCodeBlockRect from '~/features/code-blocks/utils/getCodeBlockRect';
import rectsOverlap from '~/features/code-blocks/utils/rectsOverlap';
import { createCodeBlockGraphicData } from '~/features/code-blocks/utils/createCodeBlockGraphicData';

type GridSpot = {
	gridX: number;
	gridY: number;
};

function expandRect(rect: ReturnType<typeof getCodeBlockRect>, paddingX: number, paddingY: number) {
	return {
		left: rect.left - paddingX,
		right: rect.right + paddingX,
		top: rect.top - paddingY,
		bottom: rect.bottom + paddingY,
	};
}

export function isGridSpotFree(
	spot: GridSpot,
	candidate: CodeBlockGraphicData,
	existingBlocks: CodeBlockGraphicData[],
	paddingX = 2,
	paddingY = 2
): boolean {
	const candidateAtSpot = createCodeBlockGraphicData({
		code: candidate.code,
		gridX: spot.gridX,
		gridY: spot.gridY,
		minGridWidth: candidate.minGridWidth,
		codeToRender: candidate.codeToRender,
	});
	const candidateRect = getCodeBlockRect(candidateAtSpot);

	return existingBlocks.every(block => {
		const expandedRect = expandRect(getCodeBlockRect(block), paddingX, paddingY);
		return !rectsOverlap(expandedRect, candidateRect);
	});
}

/**
 * Finds a free grid spot below the existing cluster of blocks.
 * Keeps a padding so the new block doesn't sit directly against the cluster.
 */
export default function findFreeSpotBelowCluster(
	existingBlocks: CodeBlockGraphicData[],
	candidate: CodeBlockGraphicData,
	paddingX = 2,
	paddingY = 2
): GridSpot {
	if (existingBlocks.length === 0) {
		return { gridX: 0, gridY: 0 };
	}

	let minX = Infinity;
	let maxBottom = -Infinity;

	for (const block of existingBlocks) {
		const rect = getCodeBlockRect(block);
		minX = Math.min(minX, rect.left);
		maxBottom = Math.max(maxBottom, rect.bottom);
	}

	const gridX = minX + paddingX;
	const gridY = maxBottom + paddingY;

	if (isGridSpotFree({ gridX, gridY }, candidate, existingBlocks, paddingX, paddingY)) {
		return { gridX, gridY };
	}

	// Fallback: keep moving down until we find a free spot (should be fast).
	let cursorY = gridY;
	while (!isGridSpotFree({ gridX, gridY: cursorY }, candidate, existingBlocks, paddingX, paddingY)) {
		cursorY += paddingY + 1;
	}

	return { gridX, gridY: cursorY };
}
