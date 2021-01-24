// @ts-ignore
import { getFontPointer, memory } from './font.rs';

const pointer = getFontPointer();
const font: Uint8Array = new Uint8Array(memory.buffer.slice(pointer, pointer + 62 * 14));

export const getGlyphInfo = function (
	letter: string,
	offsetX: number = 0,
	offsetY: number = 0
): { x: number; y: number; spriteHeight: number; spriteWidth: number } {
	const code = letter.charCodeAt(0);
	let posY = 0;
	let posX = 0;

	if (code >= 97 && code <= 122) {
		posX = code - 97;
		posY = 0;
	} else if (code >= 48 && code <= 57) {
		posX = code - 48;
		posY = 2;
	} else if (code >= 65 && code <= 90) {
		posX = code - 65;
		posY = 1;
	} else {
		return;
	}

	return {
		x: (7 + 1) * posX + offsetX,
		y: (15 + 1) * posY + offsetY,
		spriteHeight: 15,
		spriteWidth: 7,
	};
};

const forEachBit = function (byte: number, callback: (isByteSet: boolean, nthBit: number) => void) {
	for (let i = 0; i < 8; i++) {
		const mask = 1 << (7 - i);
		callback((byte & mask) !== 0, i);
	}
};

const generateFont = function (ctx: OffscreenCanvasRenderingContext2D, x: number = 0, y: number = 0, font: Uint8Array) {
	// A-Z
	for (let j = 0; j < 26; j++) {
		for (let i = 0; i < 14; i++) {
			forEachBit(font[j * 14 + i], function (bit, nthBit) {
				bit && ctx.fillRect(j * 8 + nthBit + x, i + y, 1, 1);
			});
		}
	}

	// a-z
	for (let j = 26; j < 52; j++) {
		for (let i = 0; i < 14; i++) {
			forEachBit(font[j * 14 + i], function (bit, nthBit) {
				bit && ctx.fillRect((j - 26) * 8 + nthBit + x, i + 16 + y, 1, 1);
			});
		}
	}

	// 0-9
	for (let j = 52; j < 62; j++) {
		for (let i = 0; i < 14; i++) {
			forEachBit(font[j * 14 + i], function (bit, nthBit) {
				bit && ctx.fillRect((j - 52) * 8 + nthBit + x, i + 32 + y, 1, 1);
			});
		}
	}
};

const generateFonts = function (ctx: OffscreenCanvasRenderingContext2D, x: number = 0, y: number = 0) {
	ctx.fillStyle = 'rgba(255,255,255,255)';
	generateFont(ctx, x, y, font);
	ctx.fillStyle = 'rgba(0,0,0,255)';
	generateFont(ctx, x, y + 50, font);

	const lookupTable = {};
	for (let i = 0; i < 128; i++) {
		const c = String.fromCharCode(i);
		lookupTable[c] = getGlyphInfo(c);
	}

	for (let i = 0; i < 128; i++) {
		const c = String.fromCharCode(i);
		lookupTable['black_' + c] = getGlyphInfo(c, 0, 50);
	}

	return lookupTable;
};

export default generateFonts;
