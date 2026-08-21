import type { SpriteFont, SpriteId } from '@8f4e/sprite-generator';

/**
 * Resolves character and syntax-font matrices to render-ready sprite ids outside the draw loop.
 * Spaces become empty cells while still applying any font transition at that position.
 */
export default function resolveCodeCells(
	characters: ReadonlyArray<ReadonlyArray<number | string>>,
	colorTransitions: ReadonlyArray<ReadonlyArray<SpriteFont | undefined>>,
	defaultFont: SpriteFont,
	disabledFont?: SpriteFont
): Array<Array<SpriteId | null>> {
	return characters.map((line, row) => {
		let currentFont = disabledFont ?? defaultFont;
		return line.map((character, column) => {
			const nextFont = colorTransitions[row]?.[column];
			if (!disabledFont && nextFont) {
				currentFont = nextFont;
			}
			if (character === 32) {
				return null;
			}
			return currentFont[character] ?? currentFont[63];
		});
	});
}
