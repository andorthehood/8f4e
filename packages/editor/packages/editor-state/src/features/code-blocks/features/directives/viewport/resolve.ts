import type { ViewportAnchor } from '../types';

export interface ViewportAnchoredPositionInput {
	anchor: ViewportAnchor;
	/** @pos offset along the inward axis (grid units). Positive = inward from anchored edges. */
	posX: number;
	posY: number;
	/** World-space pixel origin of the viewport (top-left corner of visible area). */
	viewportX: number;
	viewportY: number;
	/**
	 * Grid-aligned pixel dimensions of the visible viewport area.
	 * Must be pre-floored to the nearest grid unit (use viewport.roundedWidth / roundedHeight).
	 * Passing raw pixel dimensions will produce off-grid positions for right/bottom anchors.
	 */
	viewportWidth: number;
	viewportHeight: number;
	/** Block pixel dimensions (needed for right/bottom anchoring). */
	blockWidth: number;
	blockHeight: number;
	/** Grid unit sizes for coordinate conversion. */
	vGrid: number;
	hGrid: number;
}

/**
 * Resolves the world-space pixel position of a viewport-anchored code block.
 *
 * @pos is interpreted as an inward offset from the specified viewport corner:
 * - top-left:     +x moves right, +y moves down
 * - top-right:    +x moves left,  +y moves down
 * - bottom-left:  +x moves right, +y moves up
 * - bottom-right: +x moves left,  +y moves up
 *
 * The resulting screen position is clamped so the anchored corner remains within the
 * visible viewport. For blocks larger than the viewport the anchored corner is pinned
 * and overflow is permitted on the opposite side.
 *
 * Returns world-space pixel coordinates (viewport.x/y + screen offset).
 */
export function resolveViewportAnchoredPosition(input: ViewportAnchoredPositionInput): { x: number; y: number } {
	const {
		anchor,
		posX,
		posY,
		viewportX,
		viewportY,
		viewportWidth,
		viewportHeight,
		blockWidth,
		blockHeight,
		vGrid,
		hGrid,
	} = input;

	const offsetX = posX * vGrid;
	const offsetY = posY * hGrid;

	// Compute unclamped screen-space position (relative to viewport top-left).
	let screenX: number;
	let screenY: number;

	switch (anchor) {
		case 'top-left':
			screenX = offsetX;
			screenY = offsetY;
			break;
		case 'top-right':
			screenX = viewportWidth - offsetX - blockWidth;
			screenY = offsetY;
			break;
		case 'bottom-left':
			screenX = offsetX;
			screenY = viewportHeight - offsetY - blockHeight;
			break;
		case 'bottom-right':
			screenX = viewportWidth - offsetX - blockWidth;
			screenY = viewportHeight - offsetY - blockHeight;
			break;
	}

	// Clamp: keep the anchored edge within the viewport; the opposite edge may overflow.
	if (anchor === 'top-left' || anchor === 'bottom-left') {
		// Left-anchored: left edge must stay >= 0.
		if (blockWidth >= viewportWidth) {
			screenX = 0;
		} else {
			screenX = Math.max(0, Math.min(screenX, viewportWidth - blockWidth));
		}
	} else {
		// Right-anchored: right edge must stay <= viewportWidth.
		if (blockWidth >= viewportWidth) {
			screenX = viewportWidth - blockWidth; // negative: left side overflows
		} else {
			screenX = Math.max(0, Math.min(screenX, viewportWidth - blockWidth));
		}
	}

	if (anchor === 'top-left' || anchor === 'top-right') {
		// Top-anchored: top edge must stay >= 0.
		if (blockHeight >= viewportHeight) {
			screenY = 0;
		} else {
			screenY = Math.max(0, Math.min(screenY, viewportHeight - blockHeight));
		}
	} else {
		// Bottom-anchored: bottom edge must stay <= viewportHeight.
		if (blockHeight >= viewportHeight) {
			screenY = viewportHeight - blockHeight;
		} else {
			screenY = Math.max(0, Math.min(screenY, viewportHeight - blockHeight));
		}
	}

	return {
		x: viewportX + screenX,
		y: viewportY + screenY,
	};
}

/**
 * Converts a world-space pixel block position back into @pos anchored offset coordinates
 * for a viewport-anchored block.
 *
 * This is the inverse of resolveViewportAnchoredPosition (without clamping).
 * Used when a viewport-anchored block is dragged to write back the new @pos.
 */
export function worldPositionToAnchoredPos(
	anchor: ViewportAnchor,
	worldX: number,
	worldY: number,
	viewportX: number,
	viewportY: number,
	viewportWidth: number,
	viewportHeight: number,
	blockWidth: number,
	blockHeight: number,
	vGrid: number,
	hGrid: number
): { gridX: number; gridY: number } {
	const screenX = worldX - viewportX;
	const screenY = worldY - viewportY;

	let offsetX: number;
	let offsetY: number;

	switch (anchor) {
		case 'top-left':
			offsetX = screenX;
			offsetY = screenY;
			break;
		case 'top-right':
			offsetX = viewportWidth - screenX - blockWidth;
			offsetY = screenY;
			break;
		case 'bottom-left':
			offsetX = screenX;
			offsetY = viewportHeight - screenY - blockHeight;
			break;
		case 'bottom-right':
			offsetX = viewportWidth - screenX - blockWidth;
			offsetY = viewportHeight - screenY - blockHeight;
			break;
	}

	return {
		gridX: Math.round(offsetX / vGrid),
		gridY: Math.round(offsetY / hGrid),
	};
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

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
			const result = worldPositionToAnchoredPos(
				'top-left',
				x,
				y,
				base.viewportX,
				base.viewportY,
				base.viewportWidth,
				base.viewportHeight,
				base.blockWidth,
				base.blockHeight,
				base.vGrid,
				base.hGrid
			);
			expect(result).toEqual({ gridX: 3, gridY: 2 });
		});

		it('round-trips top-right', () => {
			const { x, y } = resolveViewportAnchoredPosition({ ...base, anchor: 'top-right', posX: 3, posY: 2 });
			const result = worldPositionToAnchoredPos(
				'top-right',
				x,
				y,
				base.viewportX,
				base.viewportY,
				base.viewportWidth,
				base.viewportHeight,
				base.blockWidth,
				base.blockHeight,
				base.vGrid,
				base.hGrid
			);
			expect(result).toEqual({ gridX: 3, gridY: 2 });
		});

		it('round-trips bottom-left', () => {
			const { x, y } = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-left', posX: 3, posY: 2 });
			const result = worldPositionToAnchoredPos(
				'bottom-left',
				x,
				y,
				base.viewportX,
				base.viewportY,
				base.viewportWidth,
				base.viewportHeight,
				base.blockWidth,
				base.blockHeight,
				base.vGrid,
				base.hGrid
			);
			expect(result).toEqual({ gridX: 3, gridY: 2 });
		});

		it('round-trips bottom-right', () => {
			const { x, y } = resolveViewportAnchoredPosition({ ...base, anchor: 'bottom-right', posX: 3, posY: 2 });
			const result = worldPositionToAnchoredPos(
				'bottom-right',
				x,
				y,
				base.viewportX,
				base.viewportY,
				base.viewportWidth,
				base.viewportHeight,
				base.blockWidth,
				base.blockHeight,
				base.vGrid,
				base.hGrid
			);
			expect(result).toEqual({ gridX: 3, gridY: 2 });
		});
	});
}
