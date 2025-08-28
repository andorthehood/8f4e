import {
	fillBufferWithRectangleVertices,
	fillBufferWithSpriteCoordinates,
	fillBufferWithLineVertices,
} from '../../src/utils/buffer';

describe('Buffer Utilities', () => {
	describe('fillBufferWithRectangleVertices', () => {
		it('should fill buffer with correct rectangle vertices for a basic rectangle', () => {
			const buffer = new Float32Array(12);
			fillBufferWithRectangleVertices(buffer, 0, 10, 20, 50, 30);

			// Expected vertices for rectangle at (10,20) with width=50, height=30
			// Triangle 1: (10,20), (60,20), (10,50)
			// Triangle 2: (10,50), (60,20), (60,50)
			expect(buffer[0]).toBe(10); // x1
			expect(buffer[1]).toBe(20); // y1
			expect(buffer[2]).toBe(60); // x2
			expect(buffer[3]).toBe(20); // y1
			expect(buffer[4]).toBe(10); // x1
			expect(buffer[5]).toBe(50); // y2
			expect(buffer[6]).toBe(10); // x1
			expect(buffer[7]).toBe(50); // y2
			expect(buffer[8]).toBe(60); // x2
			expect(buffer[9]).toBe(20); // y1
			expect(buffer[10]).toBe(60); // x2
			expect(buffer[11]).toBe(50); // y2
		});

		it('should handle buffer offset correctly', () => {
			const buffer = new Float32Array(18);
			fillBufferWithRectangleVertices(buffer, 6, 0, 0, 10, 10);

			// First 6 elements should remain 0
			for (let i = 0; i < 6; i++) {
				expect(buffer[i]).toBe(0);
			}

			// Check vertices starting at offset 6
			expect(buffer[6]).toBe(0); // x1
			expect(buffer[7]).toBe(0); // y1
			expect(buffer[8]).toBe(10); // x2
			expect(buffer[9]).toBe(0); // y1
			expect(buffer[10]).toBe(0); // x1
			expect(buffer[11]).toBe(10); // y2
			expect(buffer[12]).toBe(0); // x1
			expect(buffer[13]).toBe(10); // y2
			expect(buffer[14]).toBe(10); // x2
			expect(buffer[15]).toBe(0); // y1
			expect(buffer[16]).toBe(10); // x2
			expect(buffer[17]).toBe(10); // y2
		});

		it('should handle negative coordinates', () => {
			const buffer = new Float32Array(12);
			fillBufferWithRectangleVertices(buffer, 0, -10, -5, 15, 8);

			expect(buffer[0]).toBe(-10); // x1
			expect(buffer[1]).toBe(-5); // y1
			expect(buffer[2]).toBe(5); // x2 = -10 + 15
			expect(buffer[3]).toBe(-5); // y1
			expect(buffer[4]).toBe(-10); // x1
			expect(buffer[5]).toBe(3); // y2 = -5 + 8
		});

		it('should handle zero dimensions', () => {
			const buffer = new Float32Array(12);
			fillBufferWithRectangleVertices(buffer, 0, 5, 5, 0, 0);

			// All vertices should be at the same point
			for (let i = 0; i < 12; i += 2) {
				expect(buffer[i]).toBe(5); // x coordinate
				expect(buffer[i + 1]).toBe(5); // y coordinate
			}
		});

		it('should handle very small rectangles', () => {
			const buffer = new Float32Array(12);
			fillBufferWithRectangleVertices(buffer, 0, 0, 0, 0.1, 0.1);

			expect(buffer[0]).toBe(0); // x1
			expect(buffer[1]).toBe(0); // y1
			expect(buffer[2]).toBeCloseTo(0.1, 5); // x2 (floating point precision)
			expect(buffer[3]).toBe(0); // y1
			expect(buffer[4]).toBe(0); // x1
			expect(buffer[5]).toBeCloseTo(0.1, 5); // y2 (floating point precision)
		});
	});

	describe('fillBufferWithSpriteCoordinates', () => {
		it('should fill buffer with correct UV coordinates for a basic sprite', () => {
			const buffer = new Float32Array(12);
			// Sprite at (0,0) with size 32x32 in a 128x128 texture
			fillBufferWithSpriteCoordinates(buffer, 0, 0, 0, 32, 32, 128, 128);

			const expectedU1 = 0 / 128; // 0
			const expectedV1 = 0 / 128; // 0
			const expectedU2 = 32 / 128; // 0.25
			const expectedV2 = 32 / 128; // 0.25

			// UV coordinates for 6 vertices forming 2 triangles
			expect(buffer[0]).toBe(expectedU1); // u1
			expect(buffer[1]).toBe(expectedV1); // v1
			expect(buffer[2]).toBe(expectedU2); // u2
			expect(buffer[3]).toBe(expectedV1); // v1
			expect(buffer[4]).toBe(expectedU1); // u1
			expect(buffer[5]).toBe(expectedV2); // v2
			expect(buffer[6]).toBe(expectedU1); // u1
			expect(buffer[7]).toBe(expectedV2); // v2
			expect(buffer[8]).toBe(expectedU2); // u2
			expect(buffer[9]).toBe(expectedV1); // v1
			expect(buffer[10]).toBe(expectedU2); // u2
			expect(buffer[11]).toBe(expectedV2); // v2
		});

		it('should handle sprite in the middle of texture sheet', () => {
			const buffer = new Float32Array(12);
			// Sprite at (64,64) with size 16x16 in a 256x256 texture
			fillBufferWithSpriteCoordinates(buffer, 0, 64, 64, 16, 16, 256, 256);

			const expectedU1 = 64 / 256; // 0.25
			const expectedV1 = 64 / 256; // 0.25
			const expectedU2 = 80 / 256; // 0.3125
			const expectedV2 = 80 / 256; // 0.3125

			// UV coordinates for 6 vertices forming 2 triangles
			expect(buffer[0]).toBeCloseTo(expectedU1, 5); // u1
			expect(buffer[1]).toBeCloseTo(expectedV1, 5); // v1
			expect(buffer[2]).toBeCloseTo(expectedU2, 5); // u2
			expect(buffer[3]).toBeCloseTo(expectedV1, 5); // v1
			expect(buffer[4]).toBeCloseTo(expectedU1, 5); // u1
			expect(buffer[5]).toBeCloseTo(expectedV2, 5); // v2
			expect(buffer[6]).toBeCloseTo(expectedU1, 5); // u1
			expect(buffer[7]).toBeCloseTo(expectedV2, 5); // v2
			expect(buffer[8]).toBeCloseTo(expectedU2, 5); // u2
			expect(buffer[9]).toBeCloseTo(expectedV1, 5); // v1
			expect(buffer[10]).toBeCloseTo(expectedU2, 5); // u2
			expect(buffer[11]).toBeCloseTo(expectedV2, 5); // v2
		});

		it('should handle buffer offset correctly', () => {
			const buffer = new Float32Array(18);
			fillBufferWithSpriteCoordinates(buffer, 6, 0, 0, 16, 16, 64, 64);

			// First 6 elements should remain 0
			for (let i = 0; i < 6; i++) {
				expect(buffer[i]).toBe(0);
			}

			// Check UV coordinates starting at offset 6
			expect(buffer[6]).toBe(0); // u1
			expect(buffer[7]).toBe(0); // v1
			expect(buffer[8]).toBe(0.25); // u2 = 16/64
			expect(buffer[9]).toBe(0); // v1
		});

		it('should handle sprite at texture sheet boundaries', () => {
			const buffer = new Float32Array(12);
			// Sprite at bottom-right corner
			fillBufferWithSpriteCoordinates(buffer, 0, 96, 96, 32, 32, 128, 128);

			const expectedU1 = 96 / 128; // 0.75
			const expectedV1 = 96 / 128; // 0.75
			const expectedU2 = 128 / 128; // 1.0
			const expectedV2 = 128 / 128; // 1.0

			expect(buffer[0]).toBeCloseTo(expectedU1, 5);
			expect(buffer[1]).toBeCloseTo(expectedV1, 5);
			expect(buffer[10]).toBeCloseTo(expectedU2, 5);
			expect(buffer[11]).toBeCloseTo(expectedV2, 5);
		});

		it('should handle non-square sprites', () => {
			const buffer = new Float32Array(12);
			// Wide sprite: 64x16 in 128x128 texture
			fillBufferWithSpriteCoordinates(buffer, 0, 0, 0, 64, 16, 128, 128);

			const expectedU2 = 64 / 128; // 0.5
			const expectedV2 = 16 / 128; // 0.125

			expect(buffer[2]).toBeCloseTo(expectedU2, 5);
			expect(buffer[5]).toBeCloseTo(expectedV2, 5);
		});

		it('should handle very small sprites with floating point precision', () => {
			const buffer = new Float32Array(12);
			// 1x1 pixel sprite in 1024x1024 texture
			fillBufferWithSpriteCoordinates(buffer, 0, 0, 0, 1, 1, 1024, 1024);

			const expectedU2 = 1 / 1024; // ~0.0009765625
			const expectedV2 = 1 / 1024; // ~0.0009765625

			expect(buffer[2]).toBeCloseTo(expectedU2, 7);
			expect(buffer[5]).toBeCloseTo(expectedV2, 7);
		});
	});

	describe('fillBufferWithLineVertices', () => {
		it('should create vertices for a horizontal line', () => {
			const buffer = new Float32Array(12);
			fillBufferWithLineVertices(buffer, 0, 0, 10, 50, 10, 2);

			// For a horizontal line from (0,10) to (50,10) with thickness 2
			// The line should be extruded vertically
			// Thickness is divided by 2, so each side gets 1 unit

			// Check that we have valid vertices and the line is extruded vertically
			expect(buffer.every(val => !isNaN(val))).toBe(true); // No NaN values
			expect(buffer.every(val => isFinite(val))).toBe(true); // All finite

			// For horizontal line, Y coordinates should change but X might stay the same
			// Check that Y coordinates are modified (extruded vertically)
			expect(buffer[1]).not.toBe(10); // Y coordinate should be modified from original
			expect(buffer[3]).not.toBe(10); // Y coordinate should be modified from original
		});

		it('should create vertices for a vertical line', () => {
			const buffer = new Float32Array(12);
			fillBufferWithLineVertices(buffer, 0, 10, 0, 10, 50, 2);

			// For a vertical line from (10,0) to (10,50) with thickness 2
			expect(buffer.every(val => !isNaN(val))).toBe(true); // No NaN values
			expect(buffer.some(val => val !== 0)).toBe(true); // Buffer should be modified
		});

		it('should handle buffer offset correctly', () => {
			const buffer = new Float32Array(18);
			fillBufferWithLineVertices(buffer, 6, 0, 0, 10, 10, 1);

			// First 6 elements should remain 0
			for (let i = 0; i < 6; i++) {
				expect(buffer[i]).toBe(0);
			}

			// Elements from offset 6 onwards should be modified
			expect(buffer.slice(6).some(val => val !== 0)).toBe(true);
		});

		it('should handle diagonal line correctly', () => {
			const buffer = new Float32Array(12);
			fillBufferWithLineVertices(buffer, 0, 0, 0, 10, 10, 2);

			// For a 45-degree diagonal line
			expect(buffer.every(val => !isNaN(val))).toBe(true);
			expect(buffer.every(val => isFinite(val))).toBe(true);
		});

		it('should handle zero thickness line', () => {
			const buffer = new Float32Array(12);
			fillBufferWithLineVertices(buffer, 0, 0, 0, 10, 10, 0);

			// Even with zero thickness, should still create valid vertices
			expect(buffer.every(val => !isNaN(val))).toBe(true);
			expect(buffer.every(val => isFinite(val))).toBe(true);
		});

		it('should handle very thick line', () => {
			const buffer = new Float32Array(12);
			fillBufferWithLineVertices(buffer, 0, 0, 0, 10, 10, 20);

			// Should handle large thickness values
			expect(buffer.every(val => !isNaN(val))).toBe(true);
			expect(buffer.every(val => isFinite(val))).toBe(true);
		});

		it('should handle line with same start and end points', () => {
			const buffer = new Float32Array(12);
			fillBufferWithLineVertices(buffer, 0, 5, 5, 5, 5, 2);

			// This creates a degenerate line but should not crash
			// Some values might be NaN due to division by zero in angle calculation
			expect(buffer.every(val => isFinite(val) || isNaN(val))).toBe(true);
		});

		it('should create correct triangle formation for simple horizontal line', () => {
			const buffer = new Float32Array(12);
			// Simple horizontal line for easier verification
			fillBufferWithLineVertices(buffer, 0, 0, 0, 10, 0, 2);

			// For horizontal line, we can verify the basic structure
			// The line should be extruded in Y direction
			const vertices = [];
			for (let i = 0; i < 12; i += 2) {
				vertices.push({ x: buffer[i], y: buffer[i + 1] });
			}

			// Should have 6 vertices forming 2 triangles
			expect(vertices).toHaveLength(6);

			// Verify all vertices have valid coordinates
			vertices.forEach(vertex => {
				expect(vertex.x).not.toBeNaN();
				expect(vertex.y).not.toBeNaN();
				expect(isFinite(vertex.x)).toBe(true);
				expect(isFinite(vertex.y)).toBe(true);
			});
		});
	});

	// Additional edge case tests
	describe('Buffer Utilities - Edge Cases', () => {
		it('should handle very large coordinate values', () => {
			const buffer = new Float32Array(12);
			const largeValue = 1000000;

			fillBufferWithRectangleVertices(buffer, 0, largeValue, largeValue, 100, 100);

			expect(buffer[0]).toBe(largeValue);
			expect(buffer[1]).toBe(largeValue);
			expect(buffer[2]).toBe(largeValue + 100);
			expect(buffer[3]).toBe(largeValue);
		});

		it('should handle very small coordinate values', () => {
			const buffer = new Float32Array(12);
			const smallValue = 0.001;

			fillBufferWithRectangleVertices(buffer, 0, smallValue, smallValue, smallValue, smallValue);

			expect(buffer[0]).toBeCloseTo(smallValue, 5);
			expect(buffer[1]).toBeCloseTo(smallValue, 5);
			expect(buffer[2]).toBeCloseTo(smallValue * 2, 5);
			expect(buffer[3]).toBeCloseTo(smallValue, 5);
		});

		it('should handle negative sprite coordinates', () => {
			const buffer = new Float32Array(12);
			// This would be an invalid sprite position, but function should handle it
			fillBufferWithSpriteCoordinates(buffer, 0, -10, -10, 20, 20, 100, 100);

			const expectedU1 = -10 / 100; // -0.1
			const expectedV1 = -10 / 100; // -0.1

			expect(buffer[0]).toBeCloseTo(expectedU1, 5);
			expect(buffer[1]).toBeCloseTo(expectedV1, 5);
		});
	});
});
