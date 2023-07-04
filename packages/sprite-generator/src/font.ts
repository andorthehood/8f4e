import { SpriteLookup } from '@8f4e/2d-engine';

import thickFont from './fonts/font';
import { Command, Config, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 0;

const CHARACTER_COUNT = 128;
const CHARACTER_WIDTH = 8;
const CHARACTER_HEIGHT = 16;

const colorNames: Array<keyof Config['colorScheme']['text']> = [
	'lineNumber',
	'instruction',
	'codeComment',
	'code',
	'numbers',
	'menuItemText',
	'menuItemTextHighlighted',
	'dialogText',
	'dialogTitle',
];

const fontPositions = Object.fromEntries(
	colorNames.map((color, i) => {
		return [color, offsetY + CHARACTER_HEIGHT * i];
	})
);

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
	charCode: number | string,
	characterWidth: number,
	characterHeight: number
): DrawingCommand[] {
	const commands: DrawingCommand[] = [];
	const char = typeof charCode === 'string' ? charCode.charCodeAt(0) : charCode;
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

export default function generateFonts(colors: Config['colorScheme']['text']): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		...colorNames.flatMap<DrawingCommand>(color => {
			return [
				[Command.FILL_COLOR, colors[color]],
				...generateFont(offsetX, fontPositions[color], thickFont, CHARACTER_WIDTH, CHARACTER_HEIGHT),
			];
		}),
	];
}

export const lookup = function (font: keyof Config['colorScheme']['text']): SpriteLookup {
	return function (letter: string | number) {
		const code = typeof letter === 'string' ? letter.charCodeAt(0) : letter;
		return {
			x: code * CHARACTER_WIDTH + offsetX,
			y: fontPositions[font],
			spriteHeight: CHARACTER_HEIGHT,
			spriteWidth: CHARACTER_WIDTH,
		};
	};
};
