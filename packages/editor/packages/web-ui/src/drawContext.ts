import type { SpriteFont, SpriteId } from '@8f4e/sprite-generator';
import { DrawContext as SpriteDrawContext, type SpriteTarget } from 'glugglug/utils';

const SPACE_CHARACTER_CODE = 32;

/**
 * Adds editor-specific fixed-cell text drawing to the numeric glugglug drawing context.
 *
 * Semantic sprite roles are resolved before rendering. This context therefore accepts only
 * numeric sprite identifiers and numeric glyph tables in its per-frame methods.
 */
export class DrawContext {
	private readonly sprites: SpriteDrawContext;
	private characterWidth: number;

	/**
	 * Creates a reusable editor drawing context.
	 *
	 * @param target - Numeric sprite destination, normally the glugglug engine.
	 * @param characterWidth - Initial fixed horizontal glyph advance in pixels.
	 */
	constructor(target: SpriteTarget, characterWidth: number) {
		this.sprites = new SpriteDrawContext(target);
		this.characterWidth = characterWidth;
	}

	/**
	 * Updates the fixed glyph advance after an atlas or font replacement.
	 *
	 * @param characterWidth - New horizontal glyph advance in pixels.
	 */
	setCharacterWidth(characterWidth: number): void {
		this.characterWidth = characterWidth;
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
	drawSprite(x: number, y: number, spriteId: SpriteId, width?: number, height?: number): void {
		this.sprites.drawSprite(x, y, spriteId, width, height);
	}

	/**
	 * Resolves and draws one line of fixed-cell text using a validated web-ui font.
	 *
	 * @param x - First glyph X coordinate relative to the current offset.
	 * @param y - Glyph row Y coordinate relative to the current offset.
	 * @param text - UTF-16 text to expand into sprite instances.
	 * @param font - Validated glyph identifiers and required fallback glyph.
	 */
	drawText(x: number, y: number, text: string, font: SpriteFont): void {
		for (let index = 0; index < text.length; index++) {
			const characterCode = text.charCodeAt(index);
			if (characterCode !== SPACE_CHARACTER_CODE) {
				this.drawSprite(x + index * this.characterWidth, y, font[characterCode] ?? font[63]);
			}
		}
	}

	/**
	 * Draws render-ready fixed-cell sprite identifiers while preserving intentional empty cells.
	 *
	 * @param x - First cell X coordinate relative to the current offset.
	 * @param y - Cell row Y coordinate relative to the current offset.
	 * @param cells - Validated sprite identifiers or `null` space cells resolved outside the render loop.
	 */
	drawResolvedText(x: number, y: number, cells: readonly (SpriteId | null)[]): void {
		for (let index = 0; index < cells.length; index++) {
			const spriteId = cells[index];
			if (spriteId !== null) {
				this.drawSprite(x + index * this.characterWidth, y, spriteId);
			}
		}
	}

	/**
	 * Starts a nested coordinate group for later sprite and text submissions.
	 *
	 * @param x - X translation to add.
	 * @param y - Y translation to add.
	 */
	startGroup(x: number, y: number): void {
		this.sprites.startGroup(x, y);
	}

	/** Ends the current coordinate group and restores its parent translation. */
	endGroup(): void {
		this.sprites.endGroup();
	}
}
