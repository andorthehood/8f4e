function pad(paddingLeft: number, arr: number[], paddingRight = 0): number[] {
	return [...new Array(paddingLeft).fill(0b00000000), ...arr, ...new Array(paddingRight).fill(0b00000000)];
}

function same(byte: number, times: number): number[] {
	return new Array(times).fill(byte);
}

function mirr(toBeMirrored: number[], middle: number[] = []): number[] {
	return [...toBeMirrored, ...middle, ...toBeMirrored.slice().reverse()];
}

export default [
	pad(14, []), // Space
	pad(
		2,
		[
			0b00010000,
			0b00011000,
			0b00011100,
			0b00011110,
			0b00011111,
			0b00011111,
			0b00011110,
			0b00011100,
			0b00011000,
			0b00010000,
		],
		2
	), // TRIANGLE_RIGHT
	pad(
		2,
		[
			0b00000001,
			0b00000011,
			0b00000111,
			0b00001111,
			0b00011111,
			0b00011111,
			0b00001111,
			0b00000111,
			0b00000011,
			0b00000001,
		],
		2
	), // TRIANGLE_LEFT
].flat();

export enum Icon {
	TRIANGLE_RIGHT = '!',
	TRIANGLE_LEFT = '"',
}
