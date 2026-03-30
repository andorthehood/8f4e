type Glyph = string[];

export default function scaleGlyphs2x(glyphs: Glyph[]): Glyph[] {
	return glyphs.map(glyph =>
		glyph.flatMap(row => {
			const scaledRow = Array.from(row, char => (char === '#' ? '##' : '  ')).join('');
			return [scaledRow, scaledRow];
		})
	);
}
