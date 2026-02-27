import { SpriteCoordinates } from 'glugglug';

import { Command, DrawingCommand, ColorScheme } from './types';

const offsetX = 0;
const offsetY = 0;

const asciiCodes = [
	0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
	32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
	61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
	90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
	115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127,
] as const;

const asciiChars = [
	'\u0000',
	'\u0001',
	'\u0002',
	'\u0003',
	'\u0004',
	'\u0005',
	'\u0006',
	'\u0007',
	'\b',
	'\t',
	'\n',
	'\u000b',
	'\f',
	'\r',
	'\u000e',
	'\u000f',
	'\u0010',
	'\u0011',
	'\u0012',
	'\u0013',
	'\u0014',
	'\u0015',
	'\u0016',
	'\u0017',
	'\u0018',
	'\u0019',
	'\u001a',
	'\u001b',
	'\u001c',
	'\u001d',
	'\u001e',
	'\u001f',
	' ',
	'!',
	'"',
	'#',
	'$',
	'%',
	'&',
	"'",
	'(',
	')',
	'*',
	'+',
	',',
	'-',
	'.',
	'/',
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	':',
	';',
	'<',
	'=',
	'>',
	'?',
	'@',
	'A',
	'B',
	'C',
	'D',
	'E',
	'F',
	'G',
	'H',
	'I',
	'J',
	'K',
	'L',
	'M',
	'N',
	'O',
	'P',
	'Q',
	'R',
	'S',
	'T',
	'U',
	'V',
	'W',
	'X',
	'Y',
	'Z',
	'[',
	'\\',
	']',
	'^',
	'_',
	'`',
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
	'{',
	'|',
	'}',
	'~',
	'',
] as const;

const colorNames: Array<keyof ColorScheme['text']> = [
	'lineNumber',
	'debugInfo',
	'instruction',
	'codeComment',
	'code',
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
	return [
		[Command.TRANSLATE, x, y],
		...asciiCodes.flatMap(code => [
			...drawCharacter(font, code, characterWidth, characterHeight),
			[Command.TRANSLATE, characterWidth, 0] as DrawingCommand,
		]),
		[Command.RESET_TRANSFORM],
	];
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
	[key in keyof ColorScheme['text'] as `font${Capitalize<string & key>}`]: Record<
		(typeof asciiChars)[number] | (typeof asciiCodes)[number],
		SpriteCoordinates
	>;
};

export const generateLookups = function (characterWidth: number, characterHeight: number) {
	return Object.fromEntries(
		colorNames.map(colorName => {
			return [
				`font` + capitalize(colorName),

				Object.fromEntries(
					[...asciiCodes, ...asciiChars].map(char => {
						const code = typeof char === 'string' ? char.charCodeAt(0) : char;
						return [
							char,
							{
								x: code * characterWidth + offsetX,
								y: generateFontPositions(characterHeight)[colorName],
								spriteHeight: characterHeight,
								spriteWidth: characterWidth,
							},
						];
					})
				),
			];
		})
	) as FontLookups;
};
