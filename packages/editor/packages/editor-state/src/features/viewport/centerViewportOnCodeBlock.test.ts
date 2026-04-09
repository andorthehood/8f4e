import { describe, it, expect } from 'vitest';

import centerViewportOnCodeBlock, { CodeBlockBounds } from './centerViewportOnCodeBlock';

import { createMockViewport } from '~/pureHelpers/testingUtils/testUtils';

function createMockCodeBlock(
	x: number,
	y: number,
	width: number,
	height: number,
	offsetX = 0,
	offsetY = 0
): CodeBlockBounds {
	return {
		x,
		y,
		width,
		height,
		offsetX,
		offsetY,
	};
}

describe('centerViewportOnCodeBlock', () => {
	it('returns the centered horizontal viewport position for a small block', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(100, 100, 200, 100);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: -200, y: -150 });
	});

	it('returns the centered position for a block at the origin', () => {
		const viewport = createMockViewport(0, 0, 400, 300);
		const codeBlock = createMockCodeBlock(0, 0, 100, 100);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: -150, y: -100 });
	});

	it('returns the centered horizontal position for a wide block', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(0, 0, 1000, 100);

		expect(centerViewportOnCodeBlock(viewport, codeBlock).x).toBe(100);
	});

	it('centers a small block vertically when it fits in the viewport', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(100, 200, 100, 100);

		expect(centerViewportOnCodeBlock(viewport, codeBlock).y).toBe(-50);
	});

	it('adds 25% viewport-height top margin for large blocks, rounded to rows', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(100, 100, 100, 800);

		expect(centerViewportOnCodeBlock(viewport, codeBlock).y).toBe(-44);
	});

	it('keeps a rounded 25% viewport-height margin above a tall block at the origin', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(0, 0, 100, 1000);

		expect(centerViewportOnCodeBlock(viewport, codeBlock).y).toBe(-144);
	});

	it('accounts for offsets in both axes', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(100, 200, 200, 100, 30, 40);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: -170, y: -10 });
	});

	it('applies the rounded 25% viewport-height top margin with offsetY for large blocks', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(0, 100, 100, 800, 0, 50);

		expect(centerViewportOnCodeBlock(viewport, codeBlock).y).toBe(6);
	});

	it('handles zero-sized blocks', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(100, 100, 0, 0);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: -300, y: -200 });
	});

	it('handles blocks with negative coordinates', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(-200, -100, 100, 100);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: -550, y: -350 });
	});

	it('handles negative offsets', () => {
		const viewport = createMockViewport(0, 0, 800, 600);
		const codeBlock = createMockCodeBlock(100, 100, 100, 100, -20, -30);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: -270, y: -180 });
	});

	it('keeps the rounded 25% viewport-height margin for oversized blocks in a very small viewport', () => {
		const viewport = createMockViewport(0, 0, 50, 50);
		const codeBlock = createMockCodeBlock(100, 100, 100, 100);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: 125, y: 84 });
	});

	it('does not mutate the provided viewport object', () => {
		const viewport = createMockViewport(999, 888, 800, 600);
		const codeBlock = createMockCodeBlock(100, 100, 200, 100);

		const originalViewport = viewport;
		const nextViewport = centerViewportOnCodeBlock(viewport, codeBlock);

		expect(viewport).toBe(originalViewport);
		expect(viewport.x).toBe(999);
		expect(viewport.y).toBe(888);
		expect(nextViewport).toEqual({ x: -200, y: -150 });
	});

	it('handles square viewport and square block', () => {
		const viewport = createMockViewport(0, 0, 600, 600);
		const codeBlock = createMockCodeBlock(400, 400, 200, 200);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: 200, y: 200 });
	});

	it('handles wide viewport and narrow block', () => {
		const viewport = createMockViewport(0, 0, 1200, 400);
		const codeBlock = createMockCodeBlock(100, 100, 50, 100);

		expect(centerViewportOnCodeBlock(viewport, codeBlock).x).toBe(-475);
	});

	it('handles tall viewport and short block', () => {
		const viewport = createMockViewport(0, 0, 400, 1000);
		const codeBlock = createMockCodeBlock(100, 100, 100, 50);

		expect(centerViewportOnCodeBlock(viewport, codeBlock).y).toBe(-375);
	});

	it('handles a typical desktop viewport', () => {
		const viewport = createMockViewport(0, 0, 1920, 1080);
		const codeBlock = createMockCodeBlock(500, 300, 400, 300);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: -260, y: -90 });
	});

	it('handles a mobile-sized viewport', () => {
		const viewport = createMockViewport(0, 0, 375, 667);
		const codeBlock = createMockCodeBlock(200, 200, 300, 400);

		expect(centerViewportOnCodeBlock(viewport, codeBlock)).toEqual({ x: 163, y: 67 });
	});
});
