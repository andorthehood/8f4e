export function pad(paddingLeft: number, arr: number[], paddingRight = 0): number[] {
	return [...new Array(paddingLeft).fill(0b00000000), ...arr, ...new Array(paddingRight).fill(0b00000000)];
}

export function same(byte: number | number[], times: number): number[] {
	return new Array(times).fill(byte).flat();
}

export function mirr(toBeMirrored: number[], middle: number[] = []): number[] {
	return [...toBeMirrored, ...middle, ...toBeMirrored.slice().reverse()];
}
