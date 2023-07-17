import { SpriteCoordinates } from '@8f4e/2d-engine';

import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 180;

const fillColors: Array<keyof ColorScheme['fill']> = [
	'menuItemBackground',
	'menuItemBackgroundHighlighted',
	'background',
	'backgroundDots',
	'moduleBackground',
	'moduleBackgroundDragged',
	'wire',
	'wireHighlighted',
	'errorMessageBackground',
	'dialogBackground',
	'dialogDimmer',
	'highlightedCodeLine',
];

export enum Icon {
	INPUT,
	SWITCH_OFF,
	SWITCH_ON,
}

export default function generate(colors: ColorScheme['fill']): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		...fillColors.flatMap<DrawingCommand>(color => {
			return [
				[Command.FILL_COLOR, colors[color]],
				[Command.RECTANGLE, 0, 0, 8, 16],
				[Command.TRANSLATE, 8, 0],
			];
		}),
	];
}

export const generateLookup = function (characterWidth: number, characterHeight: number) {
	return Object.fromEntries(
		fillColors.map(color => [
			color,
			{
				x: offsetX + fillColors.indexOf(color) * characterWidth,
				y: offsetY,
				spriteWidth: characterWidth,
				spriteHeight: characterHeight,
			},
		])
	) as Record<keyof ColorScheme['fill'], SpriteCoordinates>;
};
