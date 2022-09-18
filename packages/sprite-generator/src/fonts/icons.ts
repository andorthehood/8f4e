import { pad, same } from './utils';

export default [
	pad(16, []), // Space
	same(0b11111111, 16), // FILL
	same([0b10101010, 0b01010101], 8), // FILL
	[...same([0b10101010, 0b01000100, 0b10101010, 0b00010001], 4)],
	[...same([0b10101010, 0b01000100, 0b10101010, 0b00000000], 4)],
	[...same([0b10101010, 0b00000000], 8)],
	[...same([0b00100010, 0b00000000, 0b10101010, 0b00000000], 4)],
	[...same([0b00100010, 0b00000000, 0b10001000, 0b00000000], 4)],
	same(0b11110000, 16), // THICK_LINE_LEFT,
	same(0b00001111, 16), // THICK_LINE_RIGHT
	same(0b11000000, 16), // SLIM_LINE_LEFT
	same(0b00000011, 16), // SLIM_LINE_RIGHT
	[...same(0b11111111, 2), ...same(0b11000000, 10), ...same(0b00000000, 4)],
	[...same(0b11111111, 2), ...same(0b00000011, 10), ...same(0b00000000, 4)],
	[...same(0b00000000, 4), ...same(0b11000000, 10), ...same(0b11111111, 2)],
	[...same(0b00000000, 4), ...same(0b00000011, 10), ...same(0b11111111, 2)],
	[...same(0b00000000, 7), 0b00001000, 0b00010000, ...same(0b00000000, 7)], // DOT
].flat();

export enum Icon {
	SPACE,
	FILL,
	SEMI_FILL,
	DITHER_1,
	DITHER_2,
	DITHER_3,
	DITHER_4,
	DITHER_5,
	THICK_LINE_LEFT,
	THICK_LINE_RIGHT,
	SLIM_LINE_LEFT,
	SLIM_LINE_RIGHT,
	CORNER_TOP_LEFT,
	CORNER_TOP_RIGHT,
	CORNER_BOTTOM_LEFT,
	CORNER_BOTTOM_RIGHT,
	DOT,
}
