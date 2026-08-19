/**
 * Minimal numeric sprite destination accepted by the optional drawing utilities.
 *
 * The core {@link Engine}, test recorders, and future cache builders can satisfy
 * this contract structurally without importing the utility layer.
 */
export interface SpriteTarget {
	/**
	 * Appends one sprite rectangle to the target.
	 *
	 * @param x - Destination X coordinate in target pixels.
	 * @param y - Destination Y coordinate in target pixels.
	 * @param spriteId - Dense numeric identifier from the active atlas.
	 * @param width - Optional destination width; the target may use the sprite width when omitted.
	 * @param height - Optional destination height; the target may use the sprite height when omitted.
	 */
	drawSprite(x: number, y: number, spriteId: number, width?: number, height?: number): void;
}

/** Numeric sprite identifiers indexed by JavaScript UTF-16 character code. */
export interface GlyphIdTable {
	readonly [characterCode: number]: number | undefined;
}

/** Describes one fixed-cell sprite font used by {@link DrawContext.drawText}. */
export interface SpriteFont {
	/** Numeric sprite identifiers indexed by JavaScript UTF-16 character code. */
	readonly glyphIds: GlyphIdTable;
	/** Horizontal distance in pixels between consecutive character cells. */
	readonly advanceX: number;
}
