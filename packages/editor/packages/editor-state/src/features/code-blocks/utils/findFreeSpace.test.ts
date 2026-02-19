import { describe, it, expect } from 'vitest';

import findFreeSpace, { hasCollision, GridRect } from './findFreeSpace';

describe('findFreeSpace', () => {
	it('returns (0, 0) when there are no existing blocks', () => {
		expect(findFreeSpace([], 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('returns (0, 0) when existing block does not overlap candidate at (0, 0)', () => {
		const existing: GridRect[] = [{ gridX: 20, gridY: 0, gridWidth: 10, gridHeight: 5 }];
		expect(findFreeSpace(existing, 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('skips rows blocked at x=0 and returns first free row', () => {
		// Block occupies gridY 0..4 at x=0
		const existing: GridRect[] = [{ gridX: 0, gridY: 0, gridWidth: 10, gridHeight: 5 }];
		expect(findFreeSpace(existing, 10, 5)).toEqual({ x: 0, y: 5 });
	});

	it('finds first free row when consecutive rows are blocked', () => {
		const existing: GridRect[] = [
			{ gridX: 0, gridY: 0, gridWidth: 10, gridHeight: 3 },
			{ gridX: 0, gridY: 3, gridWidth: 10, gridHeight: 4 },
		];
		// y=0..2 blocked, y=3..6 blocked, y=7 free
		expect(findFreeSpace(existing, 10, 5)).toEqual({ x: 0, y: 7 });
	});

	it('correctly detects overlap when target is smaller than existing block', () => {
		const existing: GridRect[] = [{ gridX: 0, gridY: 0, gridWidth: 50, gridHeight: 20 }];
		expect(findFreeSpace(existing, 5, 3)).toEqual({ x: 0, y: 20 });
	});

	it('does not consider blocks positioned far to the right as blocking x=0', () => {
		const existing: GridRect[] = [{ gridX: 100, gridY: 0, gridWidth: 10, gridHeight: 5 }];
		expect(findFreeSpace(existing, 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('handles blocks at negative gridY gracefully', () => {
		// Block at negative gridY should not block y=0 placement
		const existing: GridRect[] = [{ gridX: 0, gridY: -5, gridWidth: 10, gridHeight: 3 }];
		expect(findFreeSpace(existing, 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('places multiple blocks without overlap when called sequentially', () => {
		const rects: GridRect[] = [];
		const w = 10;
		const h = 5;

		const pos1 = findFreeSpace(rects, w, h);
		expect(pos1).toEqual({ x: 0, y: 0 });
		rects.push({ gridX: pos1.x, gridY: pos1.y, gridWidth: w, gridHeight: h });

		const pos2 = findFreeSpace(rects, w, h);
		expect(pos2).toEqual({ x: 0, y: 5 });
		rects.push({ gridX: pos2.x, gridY: pos2.y, gridWidth: w, gridHeight: h });

		const pos3 = findFreeSpace(rects, w, h);
		expect(pos3).toEqual({ x: 0, y: 10 });
	});
});

describe('hasCollision', () => {
	it('returns false when no existing rects', () => {
		expect(hasCollision([], 0, 0, 10, 5)).toBe(false);
	});

	it('returns true when candidate overlaps an existing rect', () => {
		const existing: GridRect[] = [{ gridX: 5, gridY: 5, gridWidth: 10, gridHeight: 5 }];
		expect(hasCollision(existing, 5, 5, 10, 5)).toBe(true);
	});

	it('returns false when candidate is adjacent (touching but not overlapping)', () => {
		const existing: GridRect[] = [{ gridX: 0, gridY: 0, gridWidth: 10, gridHeight: 5 }];
		// Candidate starts exactly where existing ends
		expect(hasCollision(existing, 10, 0, 5, 5)).toBe(false);
		expect(hasCollision(existing, 0, 5, 10, 5)).toBe(false);
	});

	it('returns true for partial overlap', () => {
		const existing: GridRect[] = [{ gridX: 5, gridY: 0, gridWidth: 10, gridHeight: 5 }];
		// Candidate at (0,0) with width 8 overlaps existing (5..14) in x range (5..7)
		expect(hasCollision(existing, 0, 0, 8, 5)).toBe(true);
	});
});
