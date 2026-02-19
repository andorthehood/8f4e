import { describe, it, expect } from 'vitest';

import findFreeSpace, { hasCollision } from './findFreeSpace';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

describe('findFreeSpace', () => {
	it('returns (0, 0) when there are no existing blocks', () => {
		expect(findFreeSpace([], 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('returns (0, 0) when existing block does not overlap candidate at (0, 0)', () => {
		const blocks = [createMockCodeBlock({ gridX: 20, gridY: 0, gridWidth: 10, code: Array(5).fill('') })];
		expect(findFreeSpace(blocks, 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('skips rows blocked at x=0 and returns first free row', () => {
		// Block occupies gridY 0..4 at x=0 (5 code lines, gridWidth 10)
		const blocks = [createMockCodeBlock({ gridX: 0, gridY: 0, gridWidth: 10, code: Array(5).fill('') })];
		expect(findFreeSpace(blocks, 10, 5)).toEqual({ x: 0, y: 5 });
	});

	it('finds first free row when consecutive rows are blocked', () => {
		const blocks = [
			createMockCodeBlock({ gridX: 0, gridY: 0, gridWidth: 10, code: Array(3).fill('') }),
			createMockCodeBlock({ gridX: 0, gridY: 3, gridWidth: 10, code: Array(4).fill('') }),
		];
		// y=0..2 blocked, y=3..6 blocked, y=7 free
		expect(findFreeSpace(blocks, 10, 5)).toEqual({ x: 0, y: 7 });
	});

	it('correctly detects overlap when target is smaller than existing block', () => {
		const blocks = [createMockCodeBlock({ gridX: 0, gridY: 0, gridWidth: 50, code: Array(20).fill('') })];
		expect(findFreeSpace(blocks, 5, 3)).toEqual({ x: 0, y: 20 });
	});

	it('does not consider blocks positioned far to the right as blocking x=0', () => {
		const blocks = [createMockCodeBlock({ gridX: 100, gridY: 0, gridWidth: 10, code: Array(5).fill('') })];
		expect(findFreeSpace(blocks, 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('handles blocks at negative gridY gracefully', () => {
		// Block at negative gridY should not block y=0 placement
		const blocks = [createMockCodeBlock({ gridX: 0, gridY: -5, gridWidth: 10, code: Array(3).fill('') })];
		expect(findFreeSpace(blocks, 10, 5)).toEqual({ x: 0, y: 0 });
	});

	it('places multiple blocks without overlap when called sequentially', () => {
		const blocks: ReturnType<typeof createMockCodeBlock>[] = [];
		const w = 10;
		const h = 5;

		const pos1 = findFreeSpace(blocks, w, h);
		expect(pos1).toEqual({ x: 0, y: 0 });
		blocks.push(createMockCodeBlock({ gridX: pos1.x, gridY: pos1.y, gridWidth: w, code: Array(h).fill('') }));

		const pos2 = findFreeSpace(blocks, w, h);
		expect(pos2).toEqual({ x: 0, y: 5 });
		blocks.push(createMockCodeBlock({ gridX: pos2.x, gridY: pos2.y, gridWidth: w, code: Array(h).fill('') }));

		const pos3 = findFreeSpace(blocks, w, h);
		expect(pos3).toEqual({ x: 0, y: 10 });
	});
});

describe('hasCollision', () => {
	it('returns false when no existing blocks', () => {
		expect(hasCollision([], 0, 0, 10, 5)).toBe(false);
	});

	it('returns true when candidate overlaps an existing block', () => {
		const blocks = [createMockCodeBlock({ gridX: 5, gridY: 5, gridWidth: 10, code: Array(5).fill('') })];
		expect(hasCollision(blocks, 5, 5, 10, 5)).toBe(true);
	});

	it('returns false when candidate is adjacent (touching but not overlapping)', () => {
		const blocks = [createMockCodeBlock({ gridX: 0, gridY: 0, gridWidth: 10, code: Array(5).fill('') })];
		// Candidate starts exactly where existing ends
		expect(hasCollision(blocks, 10, 0, 5, 5)).toBe(false);
		expect(hasCollision(blocks, 0, 5, 10, 5)).toBe(false);
	});

	it('returns true for partial overlap', () => {
		const blocks = [createMockCodeBlock({ gridX: 5, gridY: 0, gridWidth: 10, code: Array(5).fill('') })];
		// Candidate at (0,0) with width 8 overlaps existing (5..14) in x range (5..7)
		expect(hasCollision(blocks, 0, 0, 8, 5)).toBe(true);
	});
});
