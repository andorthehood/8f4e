import { pad, same } from '../utils';

export default [
	pad(10, []), // Space
	pad(10, []), // FILL
	pad(10, []), // FILL
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []), // THICK_LINE_LEFT,
	pad(10, []), // THICK_LINE_RIGHT
	pad(10, []), // SLIM_LINE_LEFT
	pad(10, []), // SLIM_LINE_RIGHT
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
	[...same(0b00000000, 4), 0b00011000, 0b00011000, ...same(0b00000000, 4)], // DOT
	pad(10, []),
	pad(10, []),
	pad(10, []),
	pad(10, []),
].flat();
