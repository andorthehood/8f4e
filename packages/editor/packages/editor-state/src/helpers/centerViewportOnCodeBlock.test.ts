import centerViewportOnCodeBlock, { CodeBlockBounds } from './centerViewportOnCodeBlock';
import { createMockViewport } from './testUtils';

/**
 * Helper function to create a mock code block with essential properties for viewport centering tests
 */
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
	describe('horizontal centering', () => {
		it('should center a small block horizontally in the viewport', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 100, 200, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 100 + 0 + 200/2 = 200
			// Viewport center X: 800/2 = 400
			// Ideal viewport X: 200 - 400 = -200
			expect(viewport.x).toBe(-200);
		});

		it('should center a block at the origin horizontally', () => {
			const viewport = createMockViewport(0, 0, 400, 300);
			const codeBlock = createMockCodeBlock(0, 0, 100, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 0 + 0 + 100/2 = 50
			// Viewport center X: 400/2 = 200
			// Ideal viewport X: 50 - 200 = -150
			expect(viewport.x).toBe(-150);
		});

		it('should center a wide block horizontally', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(0, 0, 1000, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 0 + 0 + 1000/2 = 500
			// Viewport center X: 800/2 = 400
			// Ideal viewport X: 500 - 400 = 100
			expect(viewport.x).toBe(100);
		});
	});

	describe('vertical centering with top constraint', () => {
		it('should center a small block vertically when it fits in viewport', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 200, 100, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center Y: 200 + 0 + 100/2 = 250
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 250 - 300 = -50
			// Block top: 200 + 0 = 200
			// Constrained viewport Y: min(200, -50) = -50
			expect(viewport.y).toBe(-50);
		});

		it('should constrain viewport Y to block top for large blocks', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 100, 100, 800);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center Y: 100 + 0 + 800/2 = 500
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 500 - 300 = 200
			// Block top: 100 + 0 = 100
			// Constrained viewport Y: min(100, 200) = 100
			expect(viewport.y).toBe(100);
		});

		it('should show top of block when block is taller than viewport', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(0, 0, 100, 1000);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center Y: 0 + 0 + 1000/2 = 500
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 500 - 300 = 200
			// Block top: 0 + 0 = 0
			// Constrained viewport Y: min(0, 200) = 0
			expect(viewport.y).toBe(0);
		});
	});

	describe('code block with offsets', () => {
		it('should account for offsetX in horizontal centering', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 100, 200, 100, 50, 0);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 100 + 50 + 200/2 = 250
			// Viewport center X: 800/2 = 400
			// Ideal viewport X: 250 - 400 = -150
			expect(viewport.x).toBe(-150);
		});

		it('should account for offsetY in vertical centering', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 100, 100, 100, 0, 50);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center Y: 100 + 50 + 100/2 = 200
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 200 - 300 = -100
			// Block top: 100 + 50 = 150
			// Constrained viewport Y: min(150, -100) = -100
			expect(viewport.y).toBe(-100);
		});

		it('should account for both offsetX and offsetY', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 200, 200, 100, 30, 40);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 100 + 30 + 200/2 = 230
			// Viewport center X: 800/2 = 400
			// Expected viewport X: 230 - 400 = -170
			expect(viewport.x).toBe(-170);

			// Block center Y: 200 + 40 + 100/2 = 290
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 290 - 300 = -10
			// Block top: 200 + 40 = 240
			// Constrained viewport Y: min(240, -10) = -10
			expect(viewport.y).toBe(-10);
		});

		it('should apply top constraint with offsetY for large blocks', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(0, 100, 100, 800, 0, 50);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center Y: 100 + 50 + 800/2 = 550
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 550 - 300 = 250
			// Block top: 100 + 50 = 150
			// Constrained viewport Y: min(150, 250) = 150
			expect(viewport.y).toBe(150);
		});
	});

	describe('edge cases', () => {
		it('should handle zero-sized blocks', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 100, 0, 0);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 100 + 0 + 0/2 = 100
			// Viewport center X: 800/2 = 400
			// Expected viewport X: 100 - 400 = -300
			expect(viewport.x).toBe(-300);

			// Block center Y: 100 + 0 + 0/2 = 100
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 100 - 300 = -200
			// Block top: 100 + 0 = 100
			// Constrained viewport Y: min(100, -200) = -200
			expect(viewport.y).toBe(-200);
		});

		it('should handle blocks with negative coordinates', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(-200, -100, 100, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: -200 + 0 + 100/2 = -150
			// Viewport center X: 800/2 = 400
			// Expected viewport X: -150 - 400 = -550
			expect(viewport.x).toBe(-550);

			// Block center Y: -100 + 0 + 100/2 = -50
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: -50 - 300 = -350
			// Block top: -100 + 0 = -100
			// Constrained viewport Y: min(-100, -350) = -350
			expect(viewport.y).toBe(-350);
		});

		it('should handle negative offsets', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(100, 100, 100, 100, -20, -30);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 100 + (-20) + 100/2 = 130
			// Viewport center X: 800/2 = 400
			// Expected viewport X: 130 - 400 = -270
			expect(viewport.x).toBe(-270);

			// Block center Y: 100 + (-30) + 100/2 = 120
			// Viewport center Y: 600/2 = 300
			// Ideal viewport Y: 120 - 300 = -180
			// Block top: 100 + (-30) = 70
			// Constrained viewport Y: min(70, -180) = -180
			expect(viewport.y).toBe(-180);
		});

		it('should handle very small viewport', () => {
			const viewport = createMockViewport(0, 0, 50, 50);
			const codeBlock = createMockCodeBlock(100, 100, 100, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 100 + 0 + 100/2 = 150
			// Viewport center X: 50/2 = 25
			// Expected viewport X: 150 - 25 = 125
			expect(viewport.x).toBe(125);

			// Block center Y: 100 + 0 + 100/2 = 150
			// Viewport center Y: 50/2 = 25
			// Ideal viewport Y: 150 - 25 = 125
			// Block top: 100 + 0 = 100
			// Constrained viewport Y: min(100, 125) = 100
			expect(viewport.y).toBe(100);
		});
	});

	describe('mutation behavior', () => {
		it('should mutate the provided viewport object', () => {
			const viewport = createMockViewport(999, 888, 800, 600);
			const codeBlock = createMockCodeBlock(100, 100, 200, 100);

			const originalViewport = viewport;
			centerViewportOnCodeBlock(viewport, codeBlock);

			// Verify it's the same object (mutated in place)
			expect(viewport).toBe(originalViewport);
			// Verify values changed
			expect(viewport.x).not.toBe(999);
			expect(viewport.y).not.toBe(888);
		});

		it('should update both x and y coordinates', () => {
			const viewport = createMockViewport(0, 0, 800, 600);
			const codeBlock = createMockCodeBlock(500, 400, 100, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Both coordinates should be updated
			expect(viewport.x).not.toBe(0);
			expect(viewport.y).not.toBe(0);
		});
	});

	describe('various viewport and block size combinations', () => {
		it('should handle square viewport and square block', () => {
			const viewport = createMockViewport(0, 0, 600, 600);
			const codeBlock = createMockCodeBlock(400, 400, 200, 200);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center: (500, 500)
			// Viewport center: (300, 300)
			// Ideal viewport: (200, 200)
			// Block top: 400
			// Constrained Y: min(400, 200) = 200
			expect(viewport.x).toBe(200);
			expect(viewport.y).toBe(200);
		});

		it('should handle wide viewport and narrow block', () => {
			const viewport = createMockViewport(0, 0, 1200, 400);
			const codeBlock = createMockCodeBlock(100, 100, 50, 100);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center X: 100 + 0 + 50/2 = 125
			// Viewport center X: 1200/2 = 600
			// Expected viewport X: 125 - 600 = -475
			expect(viewport.x).toBe(-475);
		});

		it('should handle tall viewport and short block', () => {
			const viewport = createMockViewport(0, 0, 400, 1000);
			const codeBlock = createMockCodeBlock(100, 100, 100, 50);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center Y: 100 + 0 + 50/2 = 125
			// Viewport center Y: 1000/2 = 500
			// Ideal viewport Y: 125 - 500 = -375
			// Block top: 100
			// Constrained Y: min(100, -375) = -375
			expect(viewport.y).toBe(-375);
		});
	});

	describe('realistic scenarios', () => {
		it('should center a typical code block in a desktop viewport', () => {
			const viewport = createMockViewport(0, 0, 1920, 1080);
			const codeBlock = createMockCodeBlock(500, 300, 400, 300);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center: (700, 450)
			// Viewport center: (960, 540)
			// Ideal viewport: (-260, -90)
			// Block top: 300
			// Constrained Y: min(300, -90) = -90
			expect(viewport.x).toBe(-260);
			expect(viewport.y).toBe(-90);
		});

		it('should handle centering on a mobile-sized viewport', () => {
			const viewport = createMockViewport(0, 0, 375, 667);
			const codeBlock = createMockCodeBlock(200, 200, 300, 400);

			centerViewportOnCodeBlock(viewport, codeBlock);

			// Block center: (350, 400)
			// Viewport center: (187.5, 333.5)
			// Ideal viewport: (162.5, 66.5)
			// Block top: 200
			// Constrained Y: min(200, 66.5) = 66.5
			expect(viewport.x).toBe(162.5);
			expect(viewport.y).toBe(66.5);
		});
	});
});
