const Glyph = {
	SPACE: 0,
	DOT: 1,
	SWITCH_KNOB: 6,
	FILL: 7,
	SEMI_FILL: 8,
	DITHER_1: 9,
	DITHER_2: 10,
	DITHER_3: 11,
	DITHER_4: 12,
	DITHER_5: 13,
	THICK_LINE_LEFT: 14,
	THICK_LINE_RIGHT: 15,
	SLIM_LINE_LEFT: 16,
	SLIM_LINE_RIGHT: 17,
	SLASH: 18,
} as const;

export type GlyphValue = (typeof Glyph)[keyof typeof Glyph];

export default Glyph;
