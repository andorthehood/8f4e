import { SpriteLookup } from '2d-engine';
import { DrawingCommand, Command } from './types';

export function whiteKeyLeft(
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	fillColor: string,
	borderColor: string
): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, fillColor],
		[Command.RECTANGLE, 0, 0, width - cutX, height],
		[Command.RECTANGLE, 0, cutY, width, height - cutY],

		[Command.FILL_COLOR, borderColor],
		[Command.RECTANGLE, 0, 0, width - cutX, 1],
		[Command.RECTANGLE, width - cutX - 1, 0, 1, cutY],
		[Command.RECTANGLE, width - cutX, cutY, cutX, 1],
		[Command.RECTANGLE, width - 1, cutY, 1, height - cutY],
		[Command.RECTANGLE, 0, height - 1, width, 1],
		[Command.RECTANGLE, 0, 0, 1, height],
	];
}

export function whiteKeyMiddle(
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	fillColor: string,
	borderColor: string
): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, fillColor],
		[Command.RECTANGLE, cutX, 0, width - cutX * 2, height],
		[Command.RECTANGLE, 0, cutY, width, height - cutY],

		[Command.FILL_COLOR, borderColor],
		[Command.RECTANGLE, cutX, 0, width - 2 * cutX, 1],
		[Command.RECTANGLE, width - cutX - 1, 0, 1, cutY],
		[Command.RECTANGLE, width - cutX, cutY, cutX, 1],
		[Command.RECTANGLE, width - 1, cutY, 1, height - cutY],
		[Command.RECTANGLE, 0, height - 1, width, 1],
		[Command.RECTANGLE, 0, cutY, 1, height - cutY],
		[Command.RECTANGLE, 0, cutY, cutX, 1],
		[Command.RECTANGLE, cutX, 0, 1, cutY],
	];
}

export function whiteKeyRight(
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	fillColor: string,
	borderColor: string
): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, fillColor],
		[Command.RECTANGLE, cutX, 0, width - cutX, height],
		[Command.RECTANGLE, 0, cutY, width, height - cutY],

		[Command.FILL_COLOR, borderColor],
		[Command.RECTANGLE, cutX, 0, width - cutX, 1],
		[Command.RECTANGLE, width - 1, 0, 1, height],
		[Command.RECTANGLE, 0, height - 1, width, 1],
		[Command.RECTANGLE, 0, cutY, 1, height - cutY],
		[Command.RECTANGLE, 0, cutY, cutX, 1],
		[Command.RECTANGLE, cutX, 0, 1, cutY],
	];
}

export function blackKey(width: number, height: number, fillColor: string, borderColor: string): DrawingCommand[] {
	return [
		[Command.FILL_COLOR, fillColor],
		[Command.RECTANGLE, 0, 0, width, height],

		[Command.FILL_COLOR, borderColor],
		[Command.RECTANGLE, 0, 0, 1, height],
		[Command.RECTANGLE, width - 1, 0, 1, height],
		[Command.RECTANGLE, 0, 0, width, 1],
		[Command.RECTANGLE, 0, height - 1, width, 1],
	];
}

const orderedKeys = [
	whiteKeyLeft,
	whiteKeyMiddle,
	whiteKeyRight,
	whiteKeyLeft,
	whiteKeyMiddle,
	whiteKeyMiddle,
	whiteKeyRight,
];

function generateKeyboard(
	width: number,
	height: number,
	spacing: number,
	blackKeywidth: number,
	blackKeyHeight: number,
	whiteKeyFillColor: string,
	whiteKeyBorderColor: string,
	blackKeyFillColor: string,
	blackKeyBorderColor: string
): DrawingCommand[] {
	const cutX = (blackKeyWidth - spacing) / 2;
	const cutY = blackKeyHeight;
	const blackKeyOffsetRelativeToWhiteKey = width - cutX;

	return [
		...orderedKeys
			.map(keyDrawer => {
				return [
					...keyDrawer.call(this, width, height, cutX, cutY, whiteKeyFillColor, whiteKeyBorderColor),
					...([whiteKeyLeft, whiteKeyMiddle].includes(keyDrawer)
						? [
								[Command.TRANSLATE, blackKeyOffsetRelativeToWhiteKey, 0],
								...blackKey(blackKeywidth, blackKeyHeight, blackKeyFillColor, blackKeyBorderColor),
								[Command.TRANSLATE, -blackKeyOffsetRelativeToWhiteKey, 0],
						  ]
						: []),
					[Command.TRANSLATE, width + spacing, 0],
				];
			})
			.flat(),
		[Command.RESET_TRANSFORM],
	];
}

const offsetX = 0;
const offsetY = 140;
const whiteKeyWidth = 18;
const whiteKeyHeight = 14 * 4;
const blackKeyHeight = 40;
const blackKeyWidth = 12;
const spacing = 2;
const keyboardWidth = (whiteKeyWidth + spacing) * orderedKeys.length;
const cutX = (blackKeyWidth - spacing) / 2;
const blackKeyOffsetRelativeToWhiteKey = whiteKeyWidth - cutX;

export default function generate(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		...generateKeyboard(
			whiteKeyWidth,
			whiteKeyHeight,
			spacing,
			blackKeyWidth,
			blackKeyHeight,
			'rgb(255, 255, 255)',
			'rgb(255, 255, 255)',
			'rgba(0, 0, 0',
			'rgba(0, 0, 0)'
		),

		[Command.TRANSLATE, offsetX + keyboardWidth, offsetY],
		...generateKeyboard(
			whiteKeyWidth,
			whiteKeyHeight,
			spacing,
			blackKeyWidth,
			blackKeyHeight,
			'rgb(0, 0, 0)',
			'rgb(255, 255, 255)',
			'rgba(255, 255, 255, 0)',
			'rgba(0, 0, 0, 0)'
		),

		[Command.TRANSLATE, offsetX + keyboardWidth * 2, offsetY],
		...generateKeyboard(
			whiteKeyWidth,
			whiteKeyHeight,
			spacing,
			blackKeyWidth,
			blackKeyHeight,
			'rgba(255, 255, 255, 0)',
			'rgba(0, 0, 0, 0)',
			'rgb(255, 255, 255)',
			'rgb(0, 0, 0)'
		),

		[Command.TRANSLATE, offsetX + keyboardWidth * 3, offsetY],
		...generateKeyboard(
			whiteKeyWidth,
			whiteKeyHeight,
			spacing,
			blackKeyWidth,
			blackKeyHeight,
			'rgb(255, 0, 0)',
			'rgb(255, 255, 255)',
			'rgba(255, 255, 255, 0)',
			'rgba(0, 0, 0, 0)'
		),

		[Command.TRANSLATE, offsetX + keyboardWidth * 4, offsetY],
		...generateKeyboard(
			whiteKeyWidth,
			whiteKeyHeight,
			spacing,
			blackKeyWidth,
			blackKeyHeight,
			'rgba(255, 255, 255, 0)',
			'rgba(0, 0, 0, 0)',
			'rgb(255, 0, 0)',
			'rgb(0, 0, 0)'
		),
	];
}

const getWhiteKeyIndex = function (note: number) {
	const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
	return whiteKeys.indexOf(note % 12);
};

export const lookup = function (isHighlighted = false, isRed = false): SpriteLookup {
	return function (key) {
		if (typeof key !== 'number') {
			return {
				x: offsetX,
				y: offsetY,
				spriteWidth: 140,
				spriteHeight: 60,
			};
		}

		const index = getWhiteKeyIndex(key);

		if (index !== -1) {
			return {
				x:
					offsetX +
					(whiteKeyWidth + spacing) * index +
					(isHighlighted ? keyboardWidth : 0) +
					(isRed ? keyboardWidth * 3 : 0),
				y: offsetY,
				spriteWidth: whiteKeyWidth,
				spriteHeight: whiteKeyHeight,
			};
		}

		return {
			x:
				offsetX +
				blackKeyOffsetRelativeToWhiteKey +
				(isHighlighted ? keyboardWidth * 2 : 0) +
				(isRed ? keyboardWidth * 3 : 0),
			y: offsetY,
			spriteWidth: blackKeyWidth,
			spriteHeight: blackKeyHeight,
		};
	};
};
