import { SpriteLookup } from '2d-engine';
import icons from './fonts/icons';
import smallFont from './fonts/smallFont';
import thickFont from './fonts/thickFont';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 0;

const CHARACTER_COUNT = 128;
const CHARACTER_HEIGHT = 10;
const CHARACTER_WIDTH = 6;
const LINE_HEIGHT = 14;
const PADDING_TOP = 2;

const THICK_CHARACTER_WIDTH = 8;
const THICK_CHARACTER_HEIGHT = 16;
const THICK_LINE_HEIGHT = 16;

function forEachBit(
	byte: number,
	characterWidth: number,
	callback: (isByteSet: boolean, nthBit: number) => void
): void {
	for (let i = 0; i < characterWidth; i++) {
		const mask = 1 << (characterWidth - 1 - i);
		callback((byte & mask) !== 0, i);
	}
}

function generateFont(x = 0, y = 0, font: number[], characterWidth: number, characterHeight: number): DrawingCommand[] {
	//TODO: optimize this once I'm not going to be high on BNT162b2
	const commands: DrawingCommand[] = [];
	for (let j = 0; j < CHARACTER_COUNT; j++) {
		for (let i = 0; i < characterHeight; i++) {
			forEachBit(font[j * characterHeight + i], characterWidth, function (bit, nthBit) {
				bit && commands.push([Command.PIXEL, j * characterWidth + nthBit + x, i + y]);
			});
		}
	}
	return commands;
}

export default function generateFonts(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...generateFont(offsetX, offsetY + PADDING_TOP, smallFont, CHARACTER_WIDTH, CHARACTER_HEIGHT),
		[Command.FILL_COLOR, 'rgba(0,0,0,255)'],
		...generateFont(offsetX, offsetY + LINE_HEIGHT, smallFont, CHARACTER_WIDTH, CHARACTER_HEIGHT),
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...generateFont(offsetX, offsetY + LINE_HEIGHT * 2, icons, CHARACTER_WIDTH, LINE_HEIGHT),

		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...generateFont(offsetX, offsetY + LINE_HEIGHT * 3, thickFont, THICK_CHARACTER_WIDTH, THICK_CHARACTER_HEIGHT),
		[Command.FILL_COLOR, 'rgba(0,0,0,255)'],
		...generateFont(
			offsetX,
			offsetY + LINE_HEIGHT * 3 + THICK_LINE_HEIGHT,
			thickFont,
			THICK_CHARACTER_WIDTH,
			THICK_CHARACTER_HEIGHT
		),
	];
}

export const lookup = function (font: string): SpriteLookup {
	return function (letter: string) {
		const code = letter.charCodeAt(0);
		switch (font) {
			case 'small_white':
				return {
					x: (code - 32) * THICK_CHARACTER_WIDTH + offsetX,
					y: offsetY + LINE_HEIGHT * 3,
					spriteHeight: THICK_LINE_HEIGHT,
					spriteWidth: THICK_CHARACTER_WIDTH,
				};
			case 'small_black':
				return {
					x: (code - 32) * THICK_CHARACTER_WIDTH + offsetX,
					y: offsetY + LINE_HEIGHT * 3 + THICK_LINE_HEIGHT,
					spriteHeight: THICK_LINE_HEIGHT,
					spriteWidth: THICK_CHARACTER_WIDTH,
				};
			case 'icons_white':
				return {
					x: (code - 32) * THICK_CHARACTER_WIDTH + offsetX,
					y: offsetY + LINE_HEIGHT * 2,
					spriteHeight: LINE_HEIGHT,
					spriteWidth: CHARACTER_WIDTH,
				};
		}
	};
};
