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
].flat();
