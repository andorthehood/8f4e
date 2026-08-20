import type { SpriteFont, SpriteTarget } from './types.ts';

/**
 * Adds reusable CPU-side coordinate offsets and fixed-cell text expansion to a sprite target.
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

	/**
	 * Executes a legacy cache-group callback without creating or reusing cached content.
	 *
	 * This migration shim always invokes the callback exactly once and returns `false`. It leaves
	 * the active coordinate offset unchanged, so drawing inside the callback behaves like any other
	 * immediate drawing. Cache identifiers, dimensions, enablement, and alpha are intentionally ignored.
	 *
	 * @param cacheId - Legacy cache identifier, accepted but not retained or inspected.
	 * @param width - Legacy cache width, accepted but ignored.
	 * @param height - Legacy cache height, accepted but ignored.
	 * @param draw - Drawing callback to execute immediately and exactly once.
	 * @param enabled - Legacy cache toggle, accepted but ignored; the callback always executes.
	 * @param alpha - Legacy cached-composite alpha, accepted but ignored.
	 * @returns Always `false`, because no cached content was created or reused.
	 */
	cacheGroup(
		cacheId: string,
		width: number,
		height: number,
		draw: () => void,
		enabled: boolean = true,
		alpha: number = 1
	): boolean {
		draw();
		return false;
	}

	/**
	 * Expands one line of fixed-cell text directly into ordered numeric sprite submissions.
	 *
	 * Each JavaScript UTF-16 code unit indexes {@link SpriteFont.glyphIds}. Undefined glyphs are
	 * skipped while still consuming their cell advance. The loop creates no glyph arrays, substrings,
	 * or per-character objects.
	 *
	 * @param x - First character-cell X coordinate relative to the current context offset.
	 * @param y - Character-cell Y coordinate relative to the current context offset.
	 * @param text - Single-line text whose UTF-16 code units select glyph sprite ids.
	 * @param font - Numeric glyph table and fixed horizontal cell advance.
	 */
	drawText(x: number, y: number, text: string, font: SpriteFont): void {
		let glyphX = x + this.offsetX;
		const glyphY = y + this.offsetY;
		const { advanceX, glyphIds } = font;

		for (let index = 0; index < text.length; index += 1) {
			const spriteId = glyphIds[text.charCodeAt(index)];
			if (spriteId !== undefined) {
				this.target.drawSprite(glyphX, glyphY, spriteId);
			}
			glyphX += advanceX;
		}
	}
}
