import { pad, mirr } from './utils';

export default [
	pad(14, []), // Space
	pad(2, mirr([0b00010000, 0b00011000, 0b00011100, 0b00011110], [0b00011111]), 3), // TRIANGLE_RIGHT
	pad(2, mirr([0b00000001, 0b00000011, 0b00000111, 0b00001111], [0b00011111]), 3), // TRIANGLE_LEFT
	pad(14, []), // Space
	pad(0, mirr([0b00111111, 0b00100000, 0b00100000, 0b00100000, 0b00100001, 0b00100011], [0b00100111]), 1),
	pad(0, mirr([0b00111110, 0b00000010, 0b00010010, 0b00110010, 0b00110010, 0b00110010], [0b00110010]), 1),
	pad(2, mirr([0b00010000, 0b00011000, 0b00011100, 0b00011110], [0b00011111]), 3), // TRIANGLE_RIGHT
].flat();

export enum Icon {
	TRIANGLE_RIGHT = '!',
	TRIANGLE_LEFT = '"',
}
