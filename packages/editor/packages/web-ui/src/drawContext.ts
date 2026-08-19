import type { SpriteIdLookup } from '@8f4e/sprite-generator';
import { type GlyphIdTable, DrawContext as SpriteDrawContext, type SpriteTarget } from 'glugglug2/utils';

/**
 * Adds editor-specific fixed-cell text drawing to the numeric glugglug2 drawing context.
 *
 * Semantic sprite roles are resolved before rendering. This context therefore accepts only
 * numeric sprite identifiers and numeric glyph tables in its per-frame methods.
 */
export class DrawContext {
	private readonly sprites: SpriteDrawContext;
	private readonly font: { glyphIds: GlyphIdTable; advanceX: number };

	/**
	 * Creates a reusable editor drawing context.
	 *
	 * @param target - Numeric sprite destination, normally the glugglug2 engine.
	 * @param characterWidth - Initial fixed horizontal glyph advance in pixels.
	 */
	constructor(target: SpriteTarget, characterWidth: number) {
		this.sprites = new SpriteDrawContext(target);
		this.font = { glyphIds: {}, advanceX: characterWidth };
	}

	/**
	 * Updates the fixed glyph advance after an atlas or font replacement.
	 *
	 * @param characterWidth - New horizontal glyph advance in pixels.
	 */
	setCharacterWidth(characterWidth: number): void {
		this.font.advanceX = characterWidth;
	}

	/**
	 * Appends one already-resolved sprite rectangle.
	 *
	 * @param x - Destination X coordinate relative to the current offset.
	 * @param y - Destination Y coordinate relative to the current offset.
	 * @param spriteId - Dense numeric sprite identifier from the active atlas.
	 * @param width - Optional destination width.
	 * @param height - Optional destination height.
	 */
	drawSprite(x: number, y: number, spriteId: number, width?: number, height?: number): void {
		this.sprites.drawSprite(x, y, spriteId, width, height);
	}

	/**
	 * Draws one line of fixed-cell text from an already-resolved glyph table.
	 *
	 * @param x - First glyph X coordinate relative to the current offset.
	 * @param y - Glyph row Y coordinate relative to the current offset.
	 * @param text - UTF-16 text to expand into sprite instances.
	 * @param glyphIds - Numeric glyph identifiers indexed by character code.
	 */
	drawText(x: number, y: number, text: string, glyphIds: SpriteIdLookup): void {
		this.font.glyphIds = glyphIds;
		this.sprites.drawText(x, y, text, this.font);
	}

	/**
	 * Adds a nested translation to later sprite and text submissions.
	 *
	 * @param x - X translation to add.
	 * @param y - Y translation to add.
	 */
	pushOffset(x: number, y: number): void {
		this.sprites.pushOffset(x, y);
	}

	/** Restores the translation active before the most recent {@link pushOffset} call. */
	popOffset(): void {
		this.sprites.popOffset();
	}

	/**
	 * Executes an old cache-group callback immediately without retaining cached content.
	 *
	 * @param cacheId - Legacy cache identifier, accepted but ignored.
	 * @param width - Legacy cache width, accepted but ignored.
	 * @param height - Legacy cache height, accepted but ignored.
	 * @param draw - Drawing callback executed exactly once.
	 * @param enabled - Legacy cache toggle, accepted but ignored.
	 * @param alpha - Legacy cache alpha, accepted but ignored.
	 * @returns Always `false` because no cache is created.
	 */
	cacheGroup(
		cacheId: string,
		width: number,
		height: number,
		draw: () => void,
		enabled: boolean = true,
		alpha: number = 1
	): boolean {
		return this.sprites.cacheGroup(cacheId, width, height, draw, enabled, alpha);
	}
}
