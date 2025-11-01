/**
 * Converts ASCII art font glyphs to numeric bitmap arrays and vice versa.
 *
 * ASCII art format uses ' ' for unset pixels and '#' for set pixels.
 * Bitmaps are stored as arrays of numbers where each number represents a row,
 * with the most significant bit being the leftmost pixel.
 */

/**
 * Converts a single ASCII art glyph to a numeric bitmap array.
 *
 * @param asciiGlyph - Array of strings where each string is a row of the glyph
 * @param characterWidth - Width of the character in pixels
 * @returns Array of numbers representing the bitmap
 *
 * @example
 * ```ts
 * const glyph = [
 *   '   #  ',
 *   '  ###  ',
 *   ' #   # ',
 * ];
 * const bitmap = asciiToBitmap(glyph, 6);
 * // Returns: [0b000100, 0b001110, 0b010001]
 * ```
 */
export function asciiToBitmap(asciiGlyph: string[], characterWidth: number): number[] {
	return asciiGlyph.map(row => {
		let byte = 0;
		for (let i = 0; i < characterWidth; i++) {
			const char = i < row.length ? row[i] : ' ';
			if (char === '#') {
				byte |= 1 << (characterWidth - 1 - i);
			}
		}
		return byte;
	});
}

/**
 * Converts an array of ASCII art glyphs to a flat array of numbers.
 * This is the format expected by the font rendering system.
 *
 * @param asciiGlyphs - Array of ASCII art glyphs
 * @param characterWidth - Width of each character in pixels
 * @returns Flattened array of numbers representing all glyphs
 */
export function asciiGlyphsToFont(asciiGlyphs: string[][], characterWidth: number): number[] {
	return asciiGlyphs.flatMap(glyph => asciiToBitmap(glyph, characterWidth));
}
