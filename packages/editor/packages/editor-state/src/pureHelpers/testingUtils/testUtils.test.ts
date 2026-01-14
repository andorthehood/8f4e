import { describe, it, expect } from 'vitest';

import { createMockCodeBlock } from './testUtils';

import type { CodeBlockGraphicData } from '~/types';

/**
 * Normalize a block for snapshot testing by converting Maps to arrays
 * and setting lastUpdated to a fixed value
 */
function normalizeBlock(block: CodeBlockGraphicData) {
	return {
		...block,
		lastUpdated: 0,
		gaps: Array.from(block.gaps.entries()),
		extras: {
			...block.extras,
		},
	};
}

describe('createMockCodeBlock', () => {
	describe('default values', () => {
		it('should create a block with default values when called with no arguments', () => {
			const block = createMockCodeBlock();
			expect(normalizeBlock(block)).toMatchSnapshot();
		});
	});

	describe('override behavior', () => {
		it('should override position and dimensions', () => {
			const block = createMockCodeBlock({ x: 200, y: 300, width: 200, height: 150 });
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should override id and offsets', () => {
			const block = createMockCodeBlock({ id: 'custom-block', offsetX: 10, offsetY: 20 });
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should allow independent override of minGridWidth', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, minGridWidth: 64 });
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should allow override of code and other properties', () => {
			const block = createMockCodeBlock({
				code: ['line1', 'line2'],
				lineNumberColumnWidth: 3,
			});
			expect(normalizeBlock(block)).toMatchSnapshot();
		});
	});

	describe('cursor calculation', () => {
		it('should calculate cursor position correctly', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, width: 200, height: 150 });
			// Cursor X = x + offsetX + width/2 = 100 + 0 + 200/2 = 200
			// Cursor Y (relative) = height/2 = 150/2 = 75
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should calculate cursor with offsets', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, width: 200, height: 100, offsetX: 10, offsetY: 20 });
			// Cursor X = x + offsetX + width/2 = 100 + 10 + 200/2 = 210
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should use cursorY convenience parameter', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, width: 200, height: 150, cursorY: 110 });
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should prefer explicit cursor override over cursorY', () => {
			const block = createMockCodeBlock({
				x: 100,
				y: 200,
				cursorY: 110,
				cursor: { col: 5, row: 3, x: 999, y: 999 },
			});
			expect(normalizeBlock(block)).toMatchSnapshot();
		});
	});

	describe('edge cases', () => {
		it('should handle negative coordinates', () => {
			const block = createMockCodeBlock({ x: -100, y: -200 });
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should handle zero dimensions', () => {
			const block = createMockCodeBlock({ width: 0, height: 0 });
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should handle negative offsets', () => {
			const block = createMockCodeBlock({ x: 100, offsetX: -20, offsetY: -30, width: 100 });
			expect(normalizeBlock(block)).toMatchSnapshot();
		});

		it('should create independent block instances', () => {
			const block1 = createMockCodeBlock({ id: 'block1', x: 100 });
			const block2 = createMockCodeBlock({ id: 'block2', x: 200 });

			expect(block1.id).toBe('block1');
			expect(block2.id).toBe('block2');
			expect(block1.x).toBe(100);
			expect(block2.x).toBe(200);
			// Maps should be independent
			expect(block1.gaps).not.toBe(block2.gaps);
		});
	});
});
