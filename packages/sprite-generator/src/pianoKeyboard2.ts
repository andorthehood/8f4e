import { Command, DrawingCommand } from './types';
import icons, { Icon } from './fonts/thickIcons';
import { drawCharacterMatrix } from './font';
import font from './fonts/thickFont';
import { SpriteLookup } from '2d-engine';

const enum State {
	PRESSED,
	NORMAL,
	HIGHLIGHTED,
}

function whiteKeyLeft(state: State): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...drawCharacterMatrix(icons, 8, 16, [
			[Icon.FILL, Icon.THICK_LINE_LEFT],
			[Icon.FILL, Icon.THICK_LINE_LEFT],
			state === State.NORMAL ? [Icon.FILL, Icon.FILL] : [Icon.SEMI_FILL, Icon.SEMI_FILL],
			state === State.NORMAL ? [Icon.FILL, Icon.FILL] : [Icon.SEMI_FILL, Icon.SEMI_FILL],
		]),
	];
}

function blackKey(state: State): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, 'rgba(0,0,0,255)'],
		...drawCharacterMatrix(icons, 8, 16, [
			[Icon.FILL, Icon.FILL],
			[Icon.FILL, Icon.FILL],
			[Icon.SLIM_LINE_RIGHT, Icon.SLIM_LINE_LEFT],
			[Icon.SLIM_LINE_RIGHT, Icon.SLIM_LINE_LEFT],
		]),
	];
}

function whiteKeyMiddle(state: State): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...drawCharacterMatrix(icons, 8, 16, [
			[Icon.THICK_LINE_RIGHT, Icon.THICK_LINE_LEFT],
			[Icon.THICK_LINE_RIGHT, Icon.THICK_LINE_LEFT],
			state === State.NORMAL ? [Icon.FILL, Icon.FILL] : [Icon.SEMI_FILL, Icon.SEMI_FILL],
			state === State.NORMAL ? [Icon.FILL, Icon.FILL] : [Icon.SEMI_FILL, Icon.SEMI_FILL],
		]),
	];
}

function whiteKeyRight(state: State): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...drawCharacterMatrix(icons, 8, 16, [
			[Icon.THICK_LINE_RIGHT, Icon.FILL],
			[Icon.THICK_LINE_RIGHT, Icon.FILL],
			state === State.NORMAL ? [Icon.FILL, Icon.FILL] : [Icon.SEMI_FILL, Icon.SEMI_FILL],
			state === State.NORMAL ? [Icon.FILL, Icon.FILL] : [Icon.SEMI_FILL, Icon.SEMI_FILL],
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

function drawPianoKeyboard(state: State): DrawingCommand[] {
	return [
		state === State.HIGHLIGHTED
			? [Command.FILL_COLOR, 'rgba(255,0,0,255)']
			: [Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...drawCharacterMatrix(font, 8, 16, [stringToCharCodeArray('C C#D D#E F F#G G# A A#B')]),
		[Command.TRANSLATE, 0, 16],
		...(orderedKeys
			.map(keyDrawerFunction => [...keyDrawerFunction(state), [Command.TRANSLATE, 16, 0]])
			.flat(1) as DrawingCommand[]),
	];
}

export default function generate(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, 'rgba(136,126,203,255)'],
		[Command.RECTANGLE, 0, 0, orderedKeys.length * 16 * 3, 80],
		...drawPianoKeyboard(State.NORMAL),
		...drawPianoKeyboard(State.PRESSED),
		...drawPianoKeyboard(State.HIGHLIGHTED),
	];
}

export const lookup = function (isHighlighted = false, isRed = false): SpriteLookup {
	return function (key) {
		return {
			x: offsetX,
			y: offsetY,
			spriteWidth: orderedKeys.length * 16,
			spriteHeight: 60,
		};
	};
};
