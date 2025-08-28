import { Renderer } from './renderer';
import { SpriteLookup } from './types';

/**
 * High-level 2D engine - provides convenient drawing methods using sprite lookup
 */
export class Engine {
	private renderer: Renderer;

	// Performance tracking
	frameCounter: number;
	startTime: number;
	lastRenderFinishTime: number;
	lastRenderStartTime: number;

	// Transform system (for grouping sprites with relative positioning)
	offsetX: number;
	offsetY: number;
	offsetGroups: number[][];

	// Sprite lookup system
	spriteLookup: SpriteLookup;

	/**
	 * Creates a new 2D rendering engine instance
	 * @param canvas - The HTML canvas element to render to
	 */
	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new Renderer(canvas);

		// Initialize performance tracking and transform state
		this.startTime = Date.now();
		this.frameCounter = 0;
		this.offsetX = 0;
		this.offsetY = 0;
		this.offsetGroups = [];
	}

	/**
	 * Begin a transform group - all subsequent draws will be offset by (x, y)
	 * @param x - X offset to apply to all draws in this group
	 * @param y - Y offset to apply to all draws in this group
	 */
	startGroup(x: number, y: number): void {
		this.offsetX += x;
		this.offsetY += y;
		this.offsetGroups.push([x, y]); // Save offset for endGroup()
	}

	/**
	 * End the current transform group - restore previous offset
	 */
	endGroup(): void {
		const coordinates = this.offsetGroups.pop();
		if (!coordinates) {
			throw new Error('No group to end');
		}
		const [x, y] = coordinates;
		this.offsetX -= x; // Undo the offset from startGroup
		this.offsetY -= y;
	}

	/**
	 * Allocate new buffers for batching sprites
	 * @param newSize - Maximum number of sprites the buffer can hold
	 */
	growBuffer(newSize: number): void {
		this.renderer.growBuffer(newSize);
	}

	/**
	 * Handle canvas resize - update viewport and shader resolution uniform
	 * @param width - New canvas width
	 * @param height - New canvas height
	 */
	resize(width: number, height: number): void {
		this.renderer.resize(width, height);
	}

	/**
	 * Main render loop - calls user callback to populate buffers, then renders everything
	 * @param callback - Function called each frame to draw sprites
	 */
	render(callback: (timeToRender: number, fps: number, triangles: number, maxTriangles: number) => void): void {
		// Calculate performance stats and reset buffers for new frame
		const { triangles, maxTriangles } = this.renderer.getBufferStats();
		this.renderer.resetBuffers();

		// Calculate FPS and frame timing
		const fps = Math.floor(this.frameCounter / ((Date.now() - this.startTime) / 1000));
		const timeToRender = this.lastRenderFinishTime - this.lastRenderStartTime;

		this.lastRenderStartTime = performance.now();

		// Clear screen for new frame
		this.renderer.clearScreen();

		// Update time uniform for shader effects (like animations)
		const elapsedTime = (Date.now() - this.startTime) / 1000; // convert to seconds
		this.renderer.updateTime(elapsedTime);

		// Let user code draw sprites (fills the buffers)
		callback(timeToRender, fps, triangles, maxTriangles);

		// Upload all batched sprites to GPU and render
		this.renderer.renderVertexBuffer();

		// Update performance tracking and schedule next frame
		this.lastRenderFinishTime = performance.now();
		this.frameCounter++;

		// Continue render loop
		window.requestAnimationFrame(() => {
			this.render(callback);
		});
	}

	/**
	 * Draw rectangle outline using 4 lines
	 * @param x - Top left X coordinate
	 * @param y - Top left Y coordinate
	 * @param width - Rectangle width
	 * @param height - Rectangle height
	 * @param sprite - Sprite to use for line texture
	 * @param thickness - Line thickness in pixels
	 */
	drawRectangle(x: number, y: number, width: number, height: number, sprite: string | number, thickness = 1): void {
		this.drawLine(x, y, x + width, y, sprite, thickness);
		this.drawLine(x + width, y, x + width, y + height, sprite, thickness);
		this.drawLine(x + width, y + height, x, y + height, sprite, thickness);
		this.drawLine(x, y + height, x, y, sprite, thickness);
	}

	/**
	 * Load sprite sheet texture and store dimensions for UV coordinate calculation
	 * @param image - Image containing all sprites
	 */
	loadSpriteSheet(image: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas): void {
		this.renderer.loadSpriteSheet(image);
	}

	/**
	 * Low-level sprite drawing - specify exact pixel coordinates in sprite sheet
	 * @param x - Screen X position
	 * @param y - Screen Y position
	 * @param width - Rendered width
	 * @param height - Rendered height
	 * @param spriteX - X pixel in sprite sheet
	 * @param spriteY - Y pixel in sprite sheet
	 * @param spriteWidth - Width in sprite sheet
	 * @param spriteHeight - Height in sprite sheet
	 */
	drawSpriteFromCoordinates(
		x: number,
		y: number,
		width: number,
		height: number,
		spriteX: number,
		spriteY: number,
		spriteWidth: number = width,
		spriteHeight: number = height
	): void {
		// Apply transform group offsets
		x = x + this.offsetX;
		y = y + this.offsetY;

		this.renderer.drawSpriteFromCoordinates(x, y, width, height, spriteX, spriteY, spriteWidth, spriteHeight);
	}

	/**
	 * Draw line with thickness using geometric calculation
	 * @param x1 - Start X coordinate
	 * @param y1 - Start Y coordinate
	 * @param x2 - End X coordinate
	 * @param y2 - End Y coordinate
	 * @param sprite - Sprite to use for line texture
	 * @param thickness - Line thickness in pixels
	 */
	drawLine(x1: number, y1: number, x2: number, y2: number, sprite: string | number, thickness: number): void {
		// Apply transform offsets
		x1 = x1 + this.offsetX;
		y1 = y1 + this.offsetY;
		x2 = x2 + this.offsetX;
		y2 = y2 + this.offsetY;

		// Get sprite texture coordinates for line appearance
		const { x, y, spriteWidth, spriteHeight } = this.spriteLookup[sprite];

		this.renderer.drawLineFromCoordinates(x1, y1, x2, y2, x, y, spriteWidth, spriteHeight, thickness);
	}

	/**
	 * High-level sprite drawing - use sprite lookup by name/ID
	 * @param posX - Screen X position
	 * @param posY - Screen Y position
	 * @param sprite - Sprite name or ID from lookup table
	 * @param width - Optional custom width (uses sprite width if not specified)
	 * @param height - Optional custom height (uses sprite height if not specified)
	 */
	drawSprite(posX: number, posY: number, sprite: string | number, width?: number, height?: number): void {
		if (!this.spriteLookup[sprite]) {
			return; // Skip unknown sprites silently
		}

		// Get sprite coordinates from lookup table
		const { x, y, spriteWidth, spriteHeight } = this.spriteLookup[sprite];

		// Delegate to low-level drawing function
		this.drawSpriteFromCoordinates(
			posX,
			posY,
			width || spriteWidth, // Use custom size or default
			height || spriteHeight,
			x, // Sprite sheet coordinates
			y,
			spriteWidth, // Original sprite size
			spriteHeight
		);
	}

	/**
	 * Set the sprite lookup table (maps names/IDs to sprite sheet coordinates)
	 * @param spriteLookup - Object mapping sprite keys to coordinates
	 */
	setSpriteLookup(spriteLookup: SpriteLookup): void {
		this.spriteLookup = spriteLookup;
	}

	/**
	 * Draw text using sprite font - each character is a sprite
	 * @param posX - Starting X position
	 * @param posY - Starting Y position
	 * @param text - Text string to render
	 * @param sprites - Optional per-character sprite lookup overrides
	 */
	drawText(posX: number, posY: number, text: string, sprites?: Array<SpriteLookup | undefined>): void {
		// Draw each character as a sprite, positioned side by side
		for (let i = 0; i < text.length; i++) {
			// Allow per-character sprite lookup override
			if (sprites && sprites[i]) {
				const sprite = sprites[i];
				if (sprite) {
					this.spriteLookup = sprite; // Temporarily switch lookup table
				}
			}

			// Look up character sprite (e.g., 'A' -> sprite coordinates)
			const spriteDef = this.spriteLookup[text[i]];
			if (!spriteDef) {
				continue; // Skip undefined characters
			}

			// Draw character sprite at calculated position
			const { x, y, spriteWidth, spriteHeight } = spriteDef;
			this.drawSpriteFromCoordinates(posX + i * spriteWidth, posY, spriteWidth, spriteHeight, x, y);
		}
	}

	/**
	 * Helper to set shader uniform values
	 * @param name - Uniform variable name in shader
	 * @param values - 1-4 numeric values to set
	 */
	setUniform(name: string, ...values: number[]): void {
		this.renderer.setUniform(name, ...values);
	}

	/**
	 * Get/set performance measurement mode
	 */
	get isPerformanceMeasurementMode(): boolean {
		return this.renderer.isPerformanceMeasurementMode;
	}

	set isPerformanceMeasurementMode(value: boolean) {
		this.renderer.isPerformanceMeasurementMode = value;
	}
}
