import { SpriteCoordinates } from '@8f4e/2d-engine';

import { Command, DrawingCommand } from './types';
import { drawCharacterMatrix } from './font';
import { Glyph } from './fonts/types';

const enum State {
	PRESSED,
	NORMAL,
	HIGHLIGHTED,
}

const backgroundColor = 'rgba(136,126,203,255)';
const whiteKeyColor = 'rgba(255,255,255,255)';
const blackKeyColor = 'rgba(0,0,0,255)';
const highlightColor = '#6abfc6';
const pressedColor = '#50459b';

function whiteKeyLeft(state: State, font: number[], characterWidth: number, characterHeight: number): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, pressedColor]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? highlightColor : whiteKeyColor],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			[Glyph.FILL, Glyph.THICK_LINE_LEFT],
			[Glyph.FILL, Glyph.THICK_LINE_LEFT],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
		]),
	];
}

function blackKey(state: State, font: number[], characterWidth: number, characterHeight: number): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, pressedColor]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? highlightColor : blackKeyColor],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
			[Glyph.SPACE, Glyph.THICK_LINE_LEFT],
			[Glyph.SPACE, Glyph.THICK_LINE_LEFT],
		]),
	];
}

function whiteKeyMiddle(
	state: State,
	font: number[],
	characterWidth: number,
	characterHeight: number
): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, pressedColor]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? highlightColor : whiteKeyColor],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			[Glyph.THICK_LINE_RIGHT, Glyph.THICK_LINE_LEFT],
			[Glyph.THICK_LINE_RIGHT, Glyph.THICK_LINE_LEFT],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
		]),
	];
}

function whiteKeyRight(
	state: State,
	font: number[],
	characterWidth: number,
	characterHeight: number
): DrawingCommand[] {
	return [
		state === State.PRESSED
			? [Command.FILL_COLOR, pressedColor]
			: [Command.FILL_COLOR, state === State.HIGHLIGHTED ? highlightColor : whiteKeyColor],
		...drawCharacterMatrix(font, characterWidth, characterHeight, [
			[Glyph.THICK_LINE_RIGHT, Glyph.FILL],
			[Glyph.THICK_LINE_RIGHT, Glyph.FILL],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
			state === State.NORMAL ? [Glyph.FILL, Glyph.FILL] : [Glyph.FILL, Glyph.FILL],
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
	characterHeight: number
): DrawingCommand[] {
	return [
		[Command.SAVE],
		[Command.FILL_COLOR, state === State.HIGHLIGHTED ? highlightColor : whiteKeyColor],
		...drawCharacterMatrix(asciiFont, characterWidth, characterHeight, [
			stringToCharCodeArray('C C#D D#E F F#G G#A A#B'),
		]),
		[Command.TRANSLATE, 0, characterHeight],
		...(orderedKeys
			.map(keyDrawerFunction => [
				...keyDrawerFunction(state, glyphFont, characterWidth, characterHeight),
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
	characterHeight: number
): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, backgroundColor],
		[Command.RECTANGLE, 0, 0, orderedKeys.length * characterHeight * 3, 80],
		...drawPianoKeyboard(State.NORMAL, glyphFont, asciiFont, characterWidth, characterHeight),
		[Command.TRANSLATE, characterHeight * orderedKeys.length, 0],
		...drawPianoKeyboard(State.PRESSED, glyphFont, asciiFont, characterWidth, characterHeight),
		[Command.TRANSLATE, characterHeight * orderedKeys.length, 0],
		...drawPianoKeyboard(State.HIGHLIGHTED, glyphFont, asciiFont, characterWidth, characterHeight),
	];
}

export enum PianoKey {
	NORMAL,
	PRESSED,
	HIGHLIGHTED,
}

export const generateLookup = function (characterWidth: number, characterHeight: number) {
	return {
		[PianoKey.NORMAL]: {
			x: offsetX,
			y: offsetY,
			spriteWidth: orderedKeys.length * (characterWidth * 2),
			spriteHeight: characterHeight * 5,
		},
	} as Record<PianoKey, SpriteCoordinates>;
};
