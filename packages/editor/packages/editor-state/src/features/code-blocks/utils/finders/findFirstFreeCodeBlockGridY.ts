import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import getCodeBlockGridWidth from '../../features/graphicHelper/getCodeBlockGridWidth';

export interface GridBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface GridSize {
	width: number;
	height: number;
}

const CODE_BLOCK_VERTICAL_PADDING_ROWS = 2;

function rangesOverlap(startA: number, sizeA: number, startB: number, sizeB: number): boolean {
	return startA < startB + sizeB && startB < startA + sizeA;
}

function gridBoundsOverlap(boundsA: GridBounds, boundsB: GridBounds): boolean {
	return (
		rangesOverlap(boundsA.x, boundsA.width, boundsB.x, boundsB.width) &&
		rangesOverlap(boundsA.y, boundsA.height, boundsB.y, boundsB.height)
	);
}

export function getCodeBlockGridBounds(
	codeBlock: Pick<CodeBlockGraphicData, 'gridX' | 'gridY' | 'width' | 'height'>,
	{ vGrid, hGrid }: { vGrid: number; hGrid: number }
): GridBounds {
	return {
		x: codeBlock.gridX,
		y: codeBlock.gridY,
		width: Math.max(Math.ceil(codeBlock.width / vGrid), 1),
		height: Math.max(Math.ceil(codeBlock.height / hGrid), 1),
	};
}

export function getCodeBlockGridSizeFromCode(codeBlock: Pick<CodeBlockGraphicData, 'code' | 'minGridWidth'>): GridSize {
	return {
		width: getCodeBlockGridWidth(codeBlock.code, codeBlock.minGridWidth),
		height: Math.max(codeBlock.code.length, 1),
	};
}

export default function findFirstFreeCodeBlockGridY(
	existingBounds: GridBounds[],
	targetBounds: Pick<GridBounds, 'x' | 'width' | 'height'>,
	startY = 0
): number {
	let candidateY = startY;

	while (true) {
		const blockingBounds = existingBounds.filter(
			bounds =>
				rangesOverlap(bounds.x, bounds.width, targetBounds.x, targetBounds.width) &&
				rangesOverlap(bounds.y, bounds.height, candidateY, targetBounds.height)
		);

		if (blockingBounds.length === 0) {
			return candidateY;
		}

		candidateY = Math.max(...blockingBounds.map(bounds => bounds.y + bounds.height + CODE_BLOCK_VERTICAL_PADDING_ROWS));
	}
}

export function placeCodeBlockAtFirstFreeGridY(
	targetBounds: Pick<GridBounds, 'x' | 'y' | 'width' | 'height'>,
	existingBounds: GridBounds[]
): { gridX: number; gridY: number } {
	const hasCollision = existingBounds.some(bounds => gridBoundsOverlap(bounds, targetBounds));

	return {
		gridX: targetBounds.x,
		gridY: hasCollision ? findFirstFreeCodeBlockGridY(existingBounds, targetBounds, 0) : targetBounds.y,
	};
}
