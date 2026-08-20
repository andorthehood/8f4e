import type { SpriteTarget } from './types.ts';

/**
 * Adds reusable CPU-side coordinate offsets to a sprite target.
 *
 * A context owns no GPU resources and can be reused across frames. Every started group must be
 * ended; invalid group nesting is a programmer error with unspecified consequences.
 */
export class DrawContext implements SpriteTarget {
	private offsetX = 0;
	private offsetY = 0;
	private offsetDepth = 0;
	private readonly offsetXStack: number[] = [];
	private readonly offsetYStack: number[] = [];

	/**
	 * Creates a drawing context that forwards final sprite rectangles to a target.
	 *
	 * @param target - Engine, recorder, cache builder, or other numeric sprite destination.
	 */
	constructor(private readonly target: SpriteTarget) {}

	/**
	 * Starts a nested coordinate group for subsequent sprite and text submissions.
	 *
	 * Stack storage is retained and reused after it grows to the required nesting depth.
	 *
	 * @param x - X translation added to the current offset.
	 * @param y - Y translation added to the current offset.
	 */
	startGroup(x: number, y: number): void {
		this.offsetXStack[this.offsetDepth] = this.offsetX;
		this.offsetYStack[this.offsetDepth] = this.offsetY;
		this.offsetDepth += 1;
		this.offsetX += x;
		this.offsetY += y;
	}

	/**
	 * Restores the translation that was active before the most recent {@link startGroup} call.
	 *
	 * Calling this method without a matching {@link startGroup} is a programmer error with unspecified consequences.
	 */
	endGroup(): void {
		this.offsetDepth -= 1;
		this.offsetX = this.offsetXStack[this.offsetDepth];
		this.offsetY = this.offsetYStack[this.offsetDepth];
	}

	/**
	 * Applies the accumulated translation and forwards one numeric sprite to the target.
	 *
	 * @param x - Destination X coordinate relative to the current context offset.
	 * @param y - Destination Y coordinate relative to the current context offset.
	 * @param spriteId - Dense numeric identifier from the target's active atlas.
	 * @param width - Optional destination width forwarded unchanged to the target.
	 * @param height - Optional destination height forwarded unchanged to the target.
	 */
	drawSprite(x: number, y: number, spriteId: number, width?: number, height?: number): void {
		this.target.drawSprite(x + this.offsetX, y + this.offsetY, spriteId, width, height);
	}
}
