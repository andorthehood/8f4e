import { describe, it, expect } from 'vitest';

import { createMockCodeBlock } from './testUtils';

describe('createMockCodeBlock', () => {
	describe('default values', () => {
		it('should create a block with default values when called with no arguments', () => {
			const block = createMockCodeBlock();

			expect(block.id).toBe('test-block');
			expect(block.x).toBe(0);
			expect(block.y).toBe(0);
			expect(block.width).toBe(100);
			expect(block.height).toBe(100);
			expect(block.offsetX).toBe(0);
			expect(block.offsetY).toBe(0);
			expect(block.gridX).toBe(0);
			expect(block.gridY).toBe(0);
			expect(block.minGridWidth).toBe(100);
		});

		it('should set cursor defaults based on block dimensions', () => {
			const block = createMockCodeBlock();

			// Cursor X is absolute (center of block)
			expect(block.cursor.x).toBe(50); // 0 + 0 + 100/2
			// Cursor Y is relative to block (default to center)
			expect(block.cursor.y).toBe(50); // 100/2
			expect(block.cursor.col).toBe(0);
			expect(block.cursor.row).toBe(0);
		});

		it('should initialize all required properties', () => {
			const block = createMockCodeBlock();

			expect(block.code).toEqual([]);
			expect(block.codeColors).toEqual([]);
			expect(block.codeToRender).toEqual([]);
			expect(block.gaps).toBeInstanceOf(Map);
			expect(block.lineNumberColumnWidth).toBe(1);
			expect(block.lastUpdated).toBeGreaterThan(0);
			expect(block.extras).toBeDefined();
			expect(block.extras.blockHighlights).toEqual([]);
			expect(block.extras.inputs).toBeInstanceOf(Map);
			expect(block.extras.outputs).toBeInstanceOf(Map);
			expect(block.extras.debuggers).toBeInstanceOf(Map);
			expect(block.extras.switches).toBeInstanceOf(Map);
			expect(block.extras.buttons).toBeInstanceOf(Map);
			expect(block.extras.pianoKeyboards).toBeInstanceOf(Map);
			expect(block.extras.bufferPlotters).toBeInstanceOf(Map);
			expect(block.extras.errorMessages).toBeInstanceOf(Map);
		});
	});

	describe('override behavior', () => {
		it('should override default x and y', () => {
			const block = createMockCodeBlock({ x: 200, y: 300 });

			expect(block.x).toBe(200);
			expect(block.y).toBe(300);
			// gridX and gridY should match x and y by default
			expect(block.gridX).toBe(200);
			expect(block.gridY).toBe(300);
		});

		it('should override default width and height', () => {
			const block = createMockCodeBlock({ width: 200, height: 150 });

			expect(block.width).toBe(200);
			expect(block.height).toBe(150);
			// minGridWidth should match width by default
			expect(block.minGridWidth).toBe(200);
		});

		it('should override default id', () => {
			const block = createMockCodeBlock({ id: 'custom-block' });

			expect(block.id).toBe('custom-block');
		});

		it('should override offsets', () => {
			const block = createMockCodeBlock({ offsetX: 10, offsetY: 20 });

			expect(block.offsetX).toBe(10);
			expect(block.offsetY).toBe(20);
		});

		it('should allow independent override of gridX and gridY', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, gridX: 150, gridY: 250 });

			expect(block.x).toBe(100);
			expect(block.y).toBe(200);
			expect(block.gridX).toBe(150);
			expect(block.gridY).toBe(250);
		});

		it('should allow independent override of minGridWidth', () => {
			const block = createMockCodeBlock({ width: 100, minGridWidth: 64 });

			expect(block.width).toBe(100);
			expect(block.minGridWidth).toBe(64);
		});

		it('should allow override of code and other properties', () => {
			const block = createMockCodeBlock({
				code: ['line1', 'line2'],
				lineNumberColumnWidth: 3,
			});

			expect(block.code).toEqual(['line1', 'line2']);
			expect(block.lineNumberColumnWidth).toBe(3);
		});
	});

	describe('cursor calculation', () => {
		it('should calculate cursor X as absolute center of block', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, width: 200, height: 100 });

			// Cursor X = x + offsetX + width/2 = 100 + 0 + 200/2 = 200
			expect(block.cursor.x).toBe(200);
		});

		it('should calculate cursor X with offsets', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, width: 200, height: 100, offsetX: 10, offsetY: 20 });

			// Cursor X = x + offsetX + width/2 = 100 + 10 + 200/2 = 210
			expect(block.cursor.x).toBe(210);
		});

		it('should set default cursor Y as relative center of block', () => {
			const block = createMockCodeBlock({ x: 100, y: 200, width: 200, height: 150 });

			// Cursor Y (relative) = height/2 = 150/2 = 75
			expect(block.cursor.y).toBe(75);
		});

		it('should use cursorY when cursor is not explicitly overridden', () => {
			const block = createMockCodeBlock({
				x: 100,
				y: 200,
				width: 200,
				height: 150,
				cursorY: 110,
			});

			// cursorY sets cursor.y, and cursor.x is calculated
			expect(block.cursor.x).toBe(200); // 100 + 0 + 200/2
			expect(block.cursor.y).toBe(110);
			expect(block.cursor.col).toBe(0);
			expect(block.cursor.row).toBe(0);
		});

		it('should prefer explicit cursor override over cursorY', () => {
			const block = createMockCodeBlock({
				x: 100,
				y: 200,
				cursorY: 110,
				cursor: { col: 5, row: 3, x: 999, y: 999 },
			});

			// The explicit cursor override takes precedence over cursorY
			expect(block.cursor.col).toBe(5);
			expect(block.cursor.row).toBe(3);
			expect(block.cursor.x).toBe(999);
			expect(block.cursor.y).toBe(999);
		});

		it('should allow full cursor override', () => {
			const customCursor = { col: 5, row: 3, x: 500, y: 250 };
			const block = createMockCodeBlock({ cursor: customCursor });

			expect(block.cursor).toEqual(customCursor);
		});
	});

	describe('complex scenarios', () => {
		it('should handle negative coordinates', () => {
			const block = createMockCodeBlock({ x: -100, y: -200 });

			expect(block.x).toBe(-100);
			expect(block.y).toBe(-200);
			expect(block.gridX).toBe(-100);
			expect(block.gridY).toBe(-200);
			// Cursor X should still be calculated correctly
			expect(block.cursor.x).toBe(-50); // -100 + 0 + 100/2
		});

		it('should handle zero dimensions', () => {
			const block = createMockCodeBlock({ width: 0, height: 0 });

			expect(block.width).toBe(0);
			expect(block.height).toBe(0);
			expect(block.minGridWidth).toBe(0);
			expect(block.cursor.x).toBe(0); // 0 + 0 + 0/2
			expect(block.cursor.y).toBe(0); // 0/2
		});

		it('should handle negative offsets', () => {
			const block = createMockCodeBlock({ x: 100, offsetX: -20, offsetY: -30, width: 100 });

			expect(block.offsetX).toBe(-20);
			expect(block.offsetY).toBe(-30);
			// Cursor X should account for negative offset
			expect(block.cursor.x).toBe(130); // 100 + (-20) + 100/2 = 130
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
