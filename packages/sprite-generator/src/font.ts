import { SpriteLookup } from '@8f4e/2d-engine';

import thickFont from './fonts/font';
import thickIcons from './fonts/icons';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 0;

const CHARACTER_COUNT = 128;
const CHARACTER_WIDTH = 6;
const LINE_HEIGHT = 14;

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

export function drawCharacter(
	font: number[],
	charCode: number,
	characterWidth: number,
	characterHeight: number
): DrawingCommand[] {
	const commands: DrawingCommand[] = [];
	const char = charCode;
	for (let i = 0; i < characterHeight; i++) {
		forEachBit(font[char * characterHeight + i], characterWidth, function (bit, nthBit) {
			bit && commands.push([Command.PIXEL, nthBit, i]);
		});
	}
	return commands;
}

export function drawCharacterMatrix(
	font: number[],
	characterWidth: number,
	characterHeight: number,
	characterMatrix: number[][]
): DrawingCommand[] {
	const commands: DrawingCommand[] = [[Command.SAVE]];
	characterMatrix.forEach(characterArray => {
		characterArray.forEach(char => {
			commands.push(...drawCharacter(font, char, characterWidth, characterHeight), [
				Command.TRANSLATE,
				characterWidth,
				0,
			]);
		});
		commands.push([Command.TRANSLATE, characterArray.length * -8, characterHeight]);
	});
	commands.push([Command.RESTORE]);
	return commands;
}

function generateFont(x = 0, y = 0, font: number[], characterWidth: number, characterHeight: number): DrawingCommand[] {
	//TODO: optimize this once I'm not going to be high on BNT162b2
	const commands: DrawingCommand[] = [[Command.TRANSLATE, x, y]];
	for (let j = 0; j < CHARACTER_COUNT; j++) {
		commands.push(...drawCharacter(font, j, characterWidth, characterHeight), [Command.TRANSLATE, characterWidth, 0]);
	}
	commands.push([Command.RESET_TRANSFORM]);
	return commands;
}

export default function generateFonts(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...generateFont(offsetX, offsetY, thickFont, THICK_CHARACTER_WIDTH, THICK_CHARACTER_HEIGHT),
		[Command.FILL_COLOR, 'rgba(0,0,0,255)'],
		...generateFont(offsetX, offsetY + THICK_LINE_HEIGHT, thickFont, THICK_CHARACTER_WIDTH, THICK_CHARACTER_HEIGHT),
		[Command.FILL_COLOR, 'rgba(0,0,0,255)'],
		...generateFont(
			offsetX,
			offsetY + THICK_LINE_HEIGHT * 2,
			thickIcons,
			THICK_CHARACTER_WIDTH,
			THICK_CHARACTER_HEIGHT
		),
	];
}

export const lookup = function (font: string): SpriteLookup {
	return function (letter: string) {
		const code = letter.charCodeAt(0);
		switch (font) {
			case 'white':
				return {
					x: code * THICK_CHARACTER_WIDTH + offsetX,
					y: offsetY,
					spriteHeight: THICK_LINE_HEIGHT,
					spriteWidth: THICK_CHARACTER_WIDTH,
				};
			case 'black':
				return {
					x: code * THICK_CHARACTER_WIDTH + offsetX,
					y: offsetY + THICK_LINE_HEIGHT,
					spriteHeight: THICK_LINE_HEIGHT,
					spriteWidth: THICK_CHARACTER_WIDTH,
				};
			case 'icons':
				return {
					x: code * THICK_CHARACTER_WIDTH + offsetX,
					y: offsetY + THICK_LINE_HEIGHT * 2,
					spriteHeight: LINE_HEIGHT,
					spriteWidth: CHARACTER_WIDTH,
				};
		}
	};
};
