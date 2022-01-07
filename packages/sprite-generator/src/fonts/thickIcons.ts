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
	pad(16, []), // Space
	same(0b11111111, 16), // FILL
	[
		0b10101010, 0b01010101, 0b10101010, 0b01010101, 0b10101010, 0b01010101, 0b10101010, 0b01010101, 0b10101010,
		0b01010101, 0b10101010, 0b01010101, 0b10101010, 0b01010101, 0b10101010, 0b01010101,
	], // FILL
	same(0b00001111, 16), // FILL
	same(0b00000001, 16), // FILL
	same(0b00011000, 16), // FILL
	same(0b11110000, 16), // FILL
	same(0b10000000, 16), // FILL
].flat();

export enum Icon {
	TRIANGLE_RIGHT = '!',
	TRIANGLE_LEFT = '"',
}
