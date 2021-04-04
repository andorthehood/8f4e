import { SpriteLookup } from 'glugglugglug';
import smallFont from './smallFont';

const offsetX = 0;
const offsetY = 0;

const forEachBit = function (byte: number, callback: (isByteSet: boolean, nthBit: number) => void) {
	for (let i = 0; i < 5; i++) {
		const mask = 1 << (4 - i);
		callback((byte & mask) !== 0, i);
	}
};

const generateFont = function (ctx: OffscreenCanvasRenderingContext2D, x: number = 0, y: number = 0, font: number[]) {
	for (let j = 0; j < 128; j++) {
		for (let i = 0; i < 10; i++) {
			forEachBit(font[j * 10 + i], function (bit, nthBit) {
				bit && ctx.fillRect(j * 5 + nthBit + x, i + y, 1, 1);
			});
		}
	}
};

const generateFonts = function (ctx: OffscreenCanvasRenderingContext2D) {
	ctx.fillStyle = 'rgba(255,255,255,255)';
	generateFont(ctx, offsetY, offsetY, smallFont);
	ctx.fillStyle = 'rgba(0,0,0,255)';
	generateFont(ctx, offsetX, offsetY + 10, smallFont);
};

export default generateFonts;

export const lookup = function (font: string): SpriteLookup {
	return function (letter) {
		const code = letter.charCodeAt(0);
		switch (font) {
			case 'small_white':
				return {
					x: (code - 32) * 5 + offsetX,
					y: offsetY,
					spriteHeight: 10,
					spriteWidth: 5,
				};
			case 'small_black':
				return {
					x: (code - 32) * 5 + offsetX,
					y: offsetY + 10,
					spriteHeight: 10,
					spriteWidth: 5,
				};
		}
	};
};
