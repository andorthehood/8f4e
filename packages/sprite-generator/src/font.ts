import { SpriteLookup } from '2d-engine';
import icons from './fonts/icons';
import smallFont from './fonts/smallFont';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 0;

const CHARACTER_COUNT = 128;
const CHARACTER_HEIGHT = 10;
const CHARACTER_WIDTH = 6;
const LINE_HEIGHT = 14;
const PADDING_TOP = 2;

function forEachBit(byte: number, callback: (isByteSet: boolean, nthBit: number) => void): void {
	for (let i = 0; i < CHARACTER_WIDTH; i++) {
		const mask = 1 << (CHARACTER_WIDTH - 1 - i);
		callback((byte & mask) !== 0, i);
	}
}

function generateFont(x = 0, y = 0, font: number[], characterHeight: number): DrawingCommand[] {
	//TODO: optimize this once I'm not going to be high on BNT162b2
	const commands: DrawingCommand[] = [];
	for (let j = 0; j < CHARACTER_COUNT; j++) {
		for (let i = 0; i < characterHeight; i++) {
			forEachBit(font[j * characterHeight + i], function (bit, nthBit) {
				bit && commands.push([Command.PIXEL, j * CHARACTER_WIDTH + nthBit + x, i + y]);
			});
		}
	}
	return commands;
}

export default function generateFonts(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...generateFont(offsetX, offsetY + PADDING_TOP, smallFont, CHARACTER_HEIGHT),
		[Command.FILL_COLOR, 'rgba(0,0,0,255)'],
		...generateFont(offsetX, offsetY + LINE_HEIGHT, smallFont, CHARACTER_HEIGHT),
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...generateFont(offsetX, offsetY + LINE_HEIGHT * 2, icons, LINE_HEIGHT),
	];
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
			case 'icons_white':
				return {
					x: (code - 32) * CHARACTER_WIDTH + offsetX,
					y: offsetY + LINE_HEIGHT * 2,
					spriteHeight: LINE_HEIGHT,
					spriteWidth: CHARACTER_WIDTH,
				};
		}
	};
};
