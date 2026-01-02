import { ColorScheme, Command, DrawingCommand } from './types';
import { drawCharacterMatrix } from './font';
import Glyph from './fonts/types';

const enum State {
	PRESSED,
	NORMAL,
	HIGHLIGHTED,
}

function whiteKeyLeft(
	state: State,
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, colors.pianoKeyWhitePressed]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? colors.pianoKeyWhiteHighlighted : colors.pianoKeyWhite],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			[Glyph.FILL, Glyph.THICK_LINE_LEFT],
			[Glyph.FILL, Glyph.THICK_LINE_LEFT],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
		]),
	];
}

function blackKey(
	state: State,
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, colors.pianoKeyBlackPressed]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? colors.pianoKeyBlackHighlighted : colors.pianoKeyBlack],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
			[Glyph.SPACE, Glyph.THICK_LINE_LEFT],
			[Glyph.SPACE, Glyph.THICK_LINE_LEFT],
		]),
	];
}

function whiteKeyMiddle(
	state: State,
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, colors.pianoKeyWhitePressed]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? colors.pianoKeyWhiteHighlighted : colors.pianoKeyWhite],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			[Glyph.THICK_LINE_RIGHT, Glyph.THICK_LINE_LEFT],
			[Glyph.THICK_LINE_RIGHT, Glyph.THICK_LINE_LEFT],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
		]),
	];
}

function whiteKeyRight(
	state: State,
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, colors.pianoKeyWhitePressed]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? colors.pianoKeyWhiteHighlighted : colors.pianoKeyWhite],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			[Glyph.THICK_LINE_RIGHT, Glyph.FILL],
			[Glyph.THICK_LINE_RIGHT, Glyph.FILL],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.SLASH, Glyph.SLASH],
		]),
	];
}

const orderedKeys = [
	whiteKeyLeft,
	blackKey,
	whiteKeyMiddle,
	blackKey,
	whiteKeyRight,
	whiteKeyLeft,
	blackKey,
	whiteKeyMiddle,
	blackKey,
	whiteKeyMiddle,
	blackKey,
	whiteKeyRight,
];

const offsetX = 0;
const offsetY = 200;

function stringToCharCodeArray(str: string): number[] {
	const arr: number[] = [];
	for (let i = 0; i < str.length; i++) {
		arr.push(str.charCodeAt(i));
	}
	return arr;
}

function drawPianoKeyboard(
	state: State,
	glyphFont: number[],
	asciiFont: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		[Command.SAVE],
		[Command.FILL_COLOR, state === State.HIGHLIGHTED ? colors.pianoKeyboardNoteHighlighted : colors.pianoKeyboardNote],
		...drawCharacterMatrix(asciiFont, characterWidth, characterHeight, [
			stringToCharCodeArray('C C#D D#E F F#G G#A A#B'),
		]),
		[Command.TRANSLATE, 0, characterHeight],
		...(orderedKeys
			.map(keyDrawerFunction => [
				...keyDrawerFunction(state, glyphFont, characterWidth, characterHeight, colors),
				[Command.TRANSLATE, characterHeight, 0],
			])
			.flat(1) as DrawingCommand[]),
		[Command.RESTORE],
	];
}

export default function generate(
	glyphFont: number[],
	asciiFont: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, colors.pianoKeyboardBackground],
		[Command.RECTANGLE, 0, 0, orderedKeys.length * characterHeight * 3, 80],
		...drawPianoKeyboard(State.NORMAL, glyphFont, asciiFont, characterWidth, characterHeight, colors),
		[Command.TRANSLATE, characterHeight * orderedKeys.length, 0],
		...drawPianoKeyboard(State.PRESSED, glyphFont, asciiFont, characterWidth, characterHeight, colors),
		[Command.TRANSLATE, characterHeight * orderedKeys.length, 0],
		...drawPianoKeyboard(State.HIGHLIGHTED, glyphFont, asciiFont, characterWidth, characterHeight, colors),
	];
}

export enum PianoKey {
	NORMAL = 1000,
	PRESSED = 2000,
	HIGHLIGHTED = 3000,
}

export const generateLookup = function (characterWidth: number, characterHeight: number) {
	return {
		...Object.fromEntries(
			new Array(24).fill(0).map((value, index) => {
				return [
					index,
					{
						x: offsetX + index * characterWidth * 2,
						y: offsetY,
						spriteWidth: characterWidth * 2,
						spriteHeight: characterHeight * 5,
					},
				];
			})
		),
	};
};
