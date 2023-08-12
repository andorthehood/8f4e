import { pad, same } from '../utils';

export default [
	pad(10, []), // SPACE
	[...same(0b00000000, 4), 0b00011000, 0b00011000, ...same(0b00000000, 4)], // DOT
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []), // FILL
	pad(10, []), // SEMI_FILL
	pad(10, []), // DITHER_1
	pad(10, []), // DITHER_2
	pad(10, []), // DITHER_3
	pad(10, []), // DITHER_4
	pad(10, []), // DITHER_5
	pad(10, []), // THICK_LINE_LEFT,
	pad(10, []), // THICK_LINE_RIGHT
	pad(10, []), // SLIM_LINE_LEFT
	pad(10, []), // SLIM_LINE_RIGHT
].flat();
