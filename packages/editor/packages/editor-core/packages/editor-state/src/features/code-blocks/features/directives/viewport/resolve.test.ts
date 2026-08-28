import { describe, expect, it } from 'vitest';
import { resolveViewportAnchoredPosition, worldPositionToAnchoredPos } from './resolve';

const base = {
	viewportX: 0,
	viewportY: 0,
	viewportWidth: 800, // 100 * vGrid — grid-aligned
	viewportHeight: 592, // 37 * hGrid — grid-aligned (callers must pass roundedHeight, not raw height)
	blockWidth: 100,
	blockHeight: 50,
	vGrid: 8,
	hGrid: 16,
};

describe('resolveViewportAnchoredPosition', () => {
	it('top-left: @pos 0 0 places block at top-left corner', () => {
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'top-left', posX: 0, posY: 0 });
		expect(result).toEqual({ x: 0, y: 0 });
	});

	it('top-left: positive @pos moves inward', () => {
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'top-left', posX: 2, posY: 1 });
		expect(result).toEqual({ x: 16, y: 16 });
	});

	it('top-right: @pos 0 0 places block at top-right corner', () => {
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'top-right', posX: 0, posY: 0 });
		expect(result).toEqual({ x: 700, y: 0 });
	});

	it('top-right: positive @pos moves inward (left)', () => {
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'top-right', posX: 2, posY: 1 });
		expect(result).toEqual({ x: 684, y: 16 });
	});

	it('bottom-left: @pos 0 0 places block at bottom-left corner', () => {
		// screenY = 592 - 0 - 50 = 542
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-left', posX: 0, posY: 0 });
		expect(result).toEqual({ x: 0, y: 542 });
	});

	it('bottom-left: positive @pos moves inward (up)', () => {
		// screenY = 592 - 16 - 50 = 526
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-left', posX: 2, posY: 1 });
		expect(result).toEqual({ x: 16, y: 526 });
	});

	it('bottom-right: @pos 0 0 places block at bottom-right corner', () => {
		// screenY = 592 - 0 - 50 = 542
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-right', posX: 0, posY: 0 });
		expect(result).toEqual({ x: 700, y: 542 });
	});

	it('bottom-right: positive @pos moves inward', () => {
		// screenY = 592 - 16 - 50 = 526
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-right', posX: 2, posY: 1 });
		expect(result).toEqual({ x: 684, y: 526 });
	});

	it('accounts for viewport world-space origin', () => {
		const result = resolveViewportAnchoredPosition({
			...base,
			viewportX: 100,
			viewportY: 200,
			anchor: 'top-left',
			posX: 0,
			posY: 0,
		});
		expect(result).toEqual({ x: 100, y: 200 });
	});

	it('clamps top-left: negative posX is clamped to viewport left', () => {
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'top-left', posX: -5, posY: 0 });
		expect(result.x).toBe(0);
	});

	it('clamps top-right: oversized block pins right edge, left overflows', () => {
		const result = resolveViewportAnchoredPosition({
			...base,
			blockWidth: 900,
			anchor: 'top-right',
			posX: 0,
			posY: 0,
		});
		expect(result.x).toBe(base.viewportX + base.viewportWidth - 900); // negative screen offset
	});

	it('clamps bottom-left: oversized height pins top, bottom overflows', () => {
		const result = resolveViewportAnchoredPosition({
			...base,
			blockHeight: 700,
			anchor: 'bottom-left',
			posX: 0,
			posY: 0,
		});
		// bottom-anchored oversized: screenY = viewportHeight - blockHeight (negative)
		expect(result.y).toBe(base.viewportY + base.viewportHeight - 700);
	});

	it('clamps top-left: out-of-range positive offset is clamped', () => {
		const result = resolveViewportAnchoredPosition({ ...base, anchor: 'top-left', posX: 1000, posY: 0 });
		expect(result.x).toBe(base.viewportX + base.viewportWidth - base.blockWidth);
	});
});

describe('worldPositionToAnchoredPos', () => {
	it('round-trips top-left', () => {
		const { x, y } = resolveViewportAnchoredPosition({ ...base, anchor: 'top-left', posX: 3, posY: 2 });
		const result = worldPositionToAnchoredPos({
			anchor: 'top-left',
			worldX: x,
			worldY: y,
			viewportX: base.viewportX,
			viewportY: base.viewportY,
			viewportWidth: base.viewportWidth,
			viewportHeight: base.viewportHeight,
			blockWidth: base.blockWidth,
			blockHeight: base.blockHeight,
			vGrid: base.vGrid,
			hGrid: base.hGrid,
		});
		expect(result).toEqual({ gridX: 3, gridY: 2 });
	});

	it('round-trips top-right', () => {
		const { x, y } = resolveViewportAnchoredPosition({ ...base, anchor: 'top-right', posX: 3, posY: 2 });
		const result = worldPositionToAnchoredPos({
			anchor: 'top-right',
			worldX: x,
			worldY: y,
			viewportX: base.viewportX,
			viewportY: base.viewportY,
			viewportWidth: base.viewportWidth,
			viewportHeight: base.viewportHeight,
			blockWidth: base.blockWidth,
			blockHeight: base.blockHeight,
			vGrid: base.vGrid,
			hGrid: base.hGrid,
		});
		expect(result).toEqual({ gridX: 3, gridY: 2 });
	});

	it('round-trips bottom-left', () => {
		const { x, y } = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-left', posX: 3, posY: 2 });
		const result = worldPositionToAnchoredPos({
			anchor: 'bottom-left',
			worldX: x,
			worldY: y,
			viewportX: base.viewportX,
			viewportY: base.viewportY,
			viewportWidth: base.viewportWidth,
			viewportHeight: base.viewportHeight,
			blockWidth: base.blockWidth,
			blockHeight: base.blockHeight,
			vGrid: base.vGrid,
			hGrid: base.hGrid,
		});
		expect(result).toEqual({ gridX: 3, gridY: 2 });
	});

	it('round-trips bottom-right', () => {
		const { x, y } = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-right', posX: 3, posY: 2 });
		const result = worldPositionToAnchoredPos({
			anchor: 'bottom-right',
			worldX: x,
			worldY: y,
			viewportX: base.viewportX,
			viewportY: base.viewportY,
			viewportWidth: base.viewportWidth,
			viewportHeight: base.viewportHeight,
			blockWidth: base.blockWidth,
			blockHeight: base.blockHeight,
			vGrid: base.vGrid,
			hGrid: base.hGrid,
		});
		expect(result).toEqual({ gridX: 3, gridY: 2 });
	});
});
