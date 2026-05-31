import type { Viewport } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import centerViewportOnCodeBlockCursor from './centerViewportOnCodeBlockCursor';

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

		expect(nextViewport.x).toBe(-88);
		expect(nextViewport.y).toBe(176);
		expect(viewport.x).toBe(0);
		expect(viewport.y).toBe(0);
	});
});
