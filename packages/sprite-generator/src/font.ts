import { SpriteLookup } from '2d-engine';
import smallFont from './smallFont';

const offsetX = 0;
const offsetY = 0;

const CHARACTER_COUNT = 128;
const CHARACTER_HEIGHT = 10;
const CHARACTER_WIDTH = 5;
const LINE_HEIGHT = 14;
const PADDING_TOP = 2;

function forEachBit(byte: number, callback: (isByteSet: boolean, nthBit: number) => void): void {
	for (let i = 0; i < CHARACTER_WIDTH; i++) {
		const mask = 1 << (CHARACTER_WIDTH - 1 - i);
		callback((byte & mask) !== 0, i);
	}
}

function generateFont(ctx: OffscreenCanvasRenderingContext2D, x = 0, y = 0, font: number[]): void {
	for (let j = 0; j < CHARACTER_COUNT; j++) {
		for (let i = 0; i < CHARACTER_HEIGHT; i++) {
			forEachBit(font[j * CHARACTER_HEIGHT + i], function (bit, nthBit) {
				bit && ctx.fillRect(j * CHARACTER_WIDTH + nthBit + x, i + y, 1, 1);
			});
		}
	}
}

export default function generateFonts(ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.fillStyle = 'rgba(255,255,255,255)';
	generateFont(ctx, offsetX, offsetY + PADDING_TOP, smallFont);
	ctx.fillStyle = 'rgba(0,0,0,255)';
	generateFont(ctx, offsetX, offsetY + LINE_HEIGHT, smallFont);
}

export const lookup = function (font: string): SpriteLookup {
	return function (letter: string) {
		const code = letter.charCodeAt(0);
		switch (font) {
			case 'small_white':
				return {
					x: (code - 32) * CHARACTER_WIDTH + offsetX,
					y: offsetY,
					spriteHeight: LINE_HEIGHT,
					spriteWidth: CHARACTER_WIDTH,
				};
			case 'small_black':
				return {
					x: (code - 32) * CHARACTER_WIDTH + offsetX,
					y: offsetY + LINE_HEIGHT,
					spriteHeight: LINE_HEIGHT,
					spriteWidth: CHARACTER_WIDTH,
				};
		}
	};
};
