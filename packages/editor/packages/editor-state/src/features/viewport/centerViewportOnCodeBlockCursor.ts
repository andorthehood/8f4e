import type { Viewport } from './types';
import type { CodeBlockBounds } from './centerViewportOnCodeBlock';
import type { Position } from '~/types';

export interface CodeBlockCursorBounds extends CodeBlockBounds {
	cursor: {
		y: number;
	};
}

/**
 * Centers the viewport horizontally on a code block and vertically on its highlighted line.
 */
export default function centerViewportOnCodeBlockCursor<T extends CodeBlockCursorBounds>(
	viewport: Viewport,
	codeBlock: T
): Position {
	const blockCenterX = codeBlock.x + codeBlock.offsetX + codeBlock.width / 2;
	const highlightedLineY = codeBlock.y + codeBlock.offsetY + codeBlock.cursor.y;

	return {
		x: Math.round(blockCenterX - viewport.width / 2),
		y: Math.round(highlightedLineY - viewport.height / 2),
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('centerViewportOnCodeBlockCursor', () => {
		it('centers horizontally on the block and vertically on the highlighted line', () => {
			const viewport: Viewport = {
				x: 0,
				y: 0,
				width: 800,
				height: 600,
				roundedWidth: 800,
				roundedHeight: 600,
				vGrid: 8,
				hGrid: 16,
				borderLineCoordinates: {
					top: { startX: 0, startY: 0, endX: 0, endY: 0 },
					right: { startX: 0, startY: 0, endX: 0, endY: 0 },
					bottom: { startX: 0, startY: 0, endX: 0, endY: 0 },
					left: { startX: 0, startY: 0, endX: 0, endY: 0 },
				},
				center: { x: 0, y: 0 },
			};
			const codeBlock = {
				x: 200,
				y: 400,
				width: 200,
				height: 160,
				offsetX: 10,
				offsetY: 20,
				cursor: { y: 48 },
			};

			const nextViewport = centerViewportOnCodeBlockCursor(viewport, codeBlock);

			expect(nextViewport.x).toBe(-90);
			expect(nextViewport.y).toBe(168);
			expect(viewport.x).toBe(0);
			expect(viewport.y).toBe(0);
		});
	});
}
