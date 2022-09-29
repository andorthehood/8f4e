function isBitSet(byte: number, nthBit: number): boolean {
	const mask = 1 << nthBit;
	return (byte & mask) !== 0;
}

function generateMosaicCharacter(id): number[] {
	const rows = new Array(3).fill(0).map((row, index) => {
		let number = 0;
		number += isBitSet(id, index * 2) ? 0b11110000 : 0b00000000;
		number += isBitSet(id, index * 2 + 1) ? 0b00001111 : 0b00000000;
		return number;
	});

	return [
		rows[0],
		rows[0],
		rows[0],
		rows[0],
		rows[0],
		rows[1],
		rows[1],
		rows[1],
		rows[1],
		rows[1],
		rows[1],
		rows[2],
		rows[2],
		rows[2],
		rows[2],
		rows[2],
	];
}

function generateMosaicCharacters(): number[] {
	return new Array(64)
		.fill(0)
		.map((item, i) => generateMosaicCharacter(i))
		.flat();
}

export default generateMosaicCharacters();

export enum Mosaic {
	EMPTY = 0,
	LINE_LEFT = 21,
	LINE_RIGHT = 42,
	FILL = 63,
	CORNER_TOP_LEFT = 23,
	CORNER_TOP_RIGHT = 43,
	CORNER_BOTTOM_LEFT = 53,
	CORNER_BOTTOM_RIGHT = 58,
}
