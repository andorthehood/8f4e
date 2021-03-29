import { SpriteCoordinates, SpriteLookup } from 'glugglugglug';
import font from './smallFont';

const defaultSprite: SpriteCoordinates = {
	x: 0,
	y: 0,
	spriteHeight: 1,
	spriteWidth: 1,
};

const offsetX = 0;
const offsetY = 0;

const forEachBit = function (byte: number, callback: (isByteSet: boolean, nthBit: number) => void) {
	for (let i = 0; i < 5; i++) {
		const mask = 1 << (4 - i);
		callback((byte & mask) !== 0, i);
	}
};

const generateFont = function (ctx: OffscreenCanvasRenderingContext2D, x: number = 0, y: number = 0, font: number[]) {
	// A-Z
	for (let j = 0; j < 26; j++) {
		for (let i = 0; i < 10; i++) {
			forEachBit(font[j * 10 + i], function (bit, nthBit) {
				bit && ctx.fillRect(j * 5 + nthBit + x, i + y, 1, 1);
			});
		}
	}

	// a-z
	for (let j = 26; j < 52; j++) {
		for (let i = 0; i < 10; i++) {
			forEachBit(font[j * 10 + i], function (bit, nthBit) {
				bit && ctx.fillRect((j - 26) * 5 + nthBit + x, i + 10 + y, 1, 1);
			});
		}
	}

	// 0-9
	for (let j = 52; j < 62; j++) {
		for (let i = 0; i < 10; i++) {
			forEachBit(font[j * 10 + i], function (bit, nthBit) {
				bit && ctx.fillRect((j - 52) * 5 + nthBit + x, i + 20 + y, 1, 1);
			});
		}
	}
};

const generateFonts = function (ctx: OffscreenCanvasRenderingContext2D) {
	ctx.fillStyle = 'rgba(255,255,255,255)';
	generateFont(ctx, offsetY, offsetY, font);
	ctx.fillStyle = 'rgba(0,0,0,255)';
	generateFont(ctx, offsetX, offsetY + 50, font);
};

export default generateFonts;

export const lookup = function (font: string): SpriteLookup {
	return function (letter) {
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
			return defaultSprite;
		}

		return {
			x: 5 * posX + offsetX,
			y: 10 * posY + offsetY,
			spriteHeight: 10,
			spriteWidth: 5,
		};
	};
};
