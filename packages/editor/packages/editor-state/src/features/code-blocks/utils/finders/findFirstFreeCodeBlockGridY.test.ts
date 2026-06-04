import { describe, expect, it } from 'vitest';
import getCodeBlockGridWidth from '../../getCodeBlockGridWidth';
import findFirstFreeCodeBlockGridY, {
	getCodeBlockGridBounds,
	getCodeBlockGridSizeFromCode,
	placeCodeBlockAtFirstFreeGridY,
} from './findFirstFreeCodeBlockGridY';

describe('getCodeBlockGridBounds', () => {
	it('derives bounds from rendered pixel dimensions', () => {
		const bounds = getCodeBlockGridBounds(
			{
				gridX: 3,
				gridY: 4,
				width: 40,
				height: 48,
			},
			{ vGrid: 8, hGrid: 16 }
		);

		expect(bounds).toEqual({
			x: 3,
			y: 4,
			width: 5,
			height: 3,
		});
	});
});

describe('getCodeBlockGridSizeFromCode', () => {
	it('derives grid size directly from code for unrendered blocks', () => {
		const size = getCodeBlockGridSizeFromCode({
			code: ['module test', 'push 1', 'moduleEnd'],
		});

		expect(size).toEqual({
			width: getCodeBlockGridWidth(['module test', 'push 1', 'moduleEnd']),
			height: 3,
		});
	});
});

describe('findFirstFreeCodeBlockGridY', () => {
	it('returns the starting y when no horizontally overlapping block is in the way', () => {
		const result = findFirstFreeCodeBlockGridY([{ x: 20, y: 0, width: 10, height: 8 }], {
			x: 0,
			width: 10,
			height: 4,
		});

		expect(result).toBe(0);
	});

	it('finds the first vertical gap that fits the target height', () => {
		const result = findFirstFreeCodeBlockGridY(
			[
				{ x: 0, y: 0, width: 12, height: 4 },
				{ x: 0, y: 8, width: 12, height: 3 },
			],
			{ x: 0, width: 10, height: 2 }
		);

		expect(result).toBe(6);
	});

	it('jumps below merged blocking spans when the gap is too small', () => {
		const result = findFirstFreeCodeBlockGridY(
			[
				{ x: 0, y: 0, width: 10, height: 4 },
				{ x: 0, y: 5, width: 10, height: 5 },
			],
			{ x: 0, width: 10, height: 2 }
		);

		expect(result).toBe(12);
	});

	it('honors a non-zero scan starting point', () => {
		const result = findFirstFreeCodeBlockGridY(
			[
				{ x: 0, y: 0, width: 10, height: 4 },
				{ x: 0, y: 10, width: 10, height: 2 },
			],
			{ x: 0, width: 10, height: 2 },
			6
		);

		expect(result).toBe(6);
	});
});

describe('placeCodeBlockAtFirstFreeGridY', () => {
	it('keeps the preferred coordinates when there is no collision', () => {
		const result = placeCodeBlockAtFirstFreeGridY(
			{
				x: 12,
				y: 7,
				width: 32,
				height: 3,
			},
			[
				{
					x: 0,
					y: 0,
					width: 32,
					height: 4,
				},
			]
		);

		expect(result).toEqual({ gridX: 12, gridY: 7 });
	});

	it('returns the first free y when the preferred slot collides', () => {
		const result = placeCodeBlockAtFirstFreeGridY(
			{
				x: 0,
				y: 0,
				width: 32,
				height: 3,
			},
			[
				{
					x: 0,
					y: 0,
					width: 32,
					height: 4,
				},
				{
					x: 0,
					y: 8,
					width: 32,
					height: 3,
				},
			]
		);

		expect(result).toEqual({ gridX: 0, gridY: 13 });
	});
});
