import { Command, DrawingCommand } from './types';
import icons, { Icon } from './fonts/thickIcons';
import { drawCharacterMatrix } from './font';

function whiteKeyLeft(): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...drawCharacterMatrix(icons, 8, 16, [
			[Icon.FILL, Icon.THICK_LINE_LEFT],
			[Icon.FILL, Icon.THICK_LINE_LEFT],
			[Icon.FILL, Icon.FILL],
			[Icon.FILL, Icon.FILL],
		]),
	];
}

function blackKey(): DrawingCommand[] {
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

function whiteKeyMiddle(): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...drawCharacterMatrix(icons, 8, 16, [
			[Icon.THICK_LINE_RIGHT, Icon.THICK_LINE_LEFT],
			[Icon.THICK_LINE_RIGHT, Icon.THICK_LINE_LEFT],
			[Icon.FILL, Icon.FILL],
			[Icon.FILL, Icon.FILL],
		]),
	];
}

function whiteKeyRight(): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, 'rgba(255,255,255,255)'],
		...drawCharacterMatrix(icons, 8, 16, [
			[Icon.THICK_LINE_RIGHT, Icon.FILL],
			[Icon.THICK_LINE_RIGHT, Icon.FILL],
			[Icon.FILL, Icon.FILL],
			[Icon.FILL, Icon.FILL],
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

export default function generate(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		...(orderedKeys
			.map(keyDrawerFunction => [...keyDrawerFunction(), [Command.TRANSLATE, 16, 0]])
			.flat(1) as DrawingCommand[]),
	];
}
