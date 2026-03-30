import { SpriteCoordinates } from 'glugglug';

import { Command, DrawingCommand, ColorScheme } from './types';

const offsetX = 0;
const offsetY = 0;

const ASCII_START = 0;
const ASCII_END = 127;

const colorNames: Array<keyof ColorScheme['text']> = [
	'lineNumber',
	'debugInfo',
	'instruction',
	'codeComment',
	'code',
	'errorMessage',
	'disabledCode',
	'numbers',
	'menuItemText',
	'menuItemTextHighlighted',
	'dialogText',
	'dialogTitle',
	'binaryZero',
	'binaryOne',
];

function generateFontPositions(characterHeight: number) {
	return Object.fromEntries(
		colorNames.map((color, i) => {
			return [color, offsetY + characterHeight * i];
		})
	);
}

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
			if (bit) {
				commands.push([Command.PIXEL, nthBit, i]);
			}
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
	const commands: DrawingCommand[] = [[Command.TRANSLATE, x, y]];

	for (let code = ASCII_START; code <= ASCII_END; code++) {
		commands.push(...drawCharacter(font, code, characterWidth, characterHeight), [
			Command.TRANSLATE,
			characterWidth,
			0,
		]);
	}

	commands.push([Command.RESET_TRANSFORM]);
	return commands;
}

export default function generateFonts(
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['text']
): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		...colorNames.flatMap<DrawingCommand>(color => {
			return [
				[Command.FILL_COLOR, colors[color]],
				...generateFont(offsetX, generateFontPositions(characterHeight)[color], font, characterWidth, characterHeight),
			];
		}),
	];
}

function capitalize(word: string) {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

export type FontLookups = {
	[key in keyof ColorScheme['text'] as `font${Capitalize<string & key>}`]: Record<number | string, SpriteCoordinates>;
};

export const generateLookups = function (characterWidth: number, characterHeight: number) {
	return Object.fromEntries(
		colorNames.map(colorName => {
			const lookups: Record<number | string, SpriteCoordinates> = {};

			for (let code = ASCII_START; code <= ASCII_END; code++) {
				const coordinates = {
					x: code * characterWidth + offsetX,
					y: generateFontPositions(characterHeight)[colorName],
					spriteHeight: characterHeight,
					spriteWidth: characterWidth,
				};
				lookups[code] = coordinates;
				lookups[String.fromCharCode(code)] = coordinates;
			}

			return [`font` + capitalize(colorName), lookups];
		})
	) as FontLookups;
};
