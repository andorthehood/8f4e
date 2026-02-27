import { SpriteCoordinates } from 'glugglug';

import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 180;

const fillColors: Array<keyof ColorScheme['fill']> = [
	'menuItemBackground',
	'menuItemBackgroundHighlighted',
	'background',
	'backgroundDots',
	'debugInfoBackground',
	'moduleBackground',
	'moduleBackgroundDragged',
	'moduleBackgroundDisabled',
	'wire',
	'wireHighlighted',
	'errorMessageBackground',
	'dialogBackground',
	'dialogDimmer',
	'highlightedCodeLine',
	'scanLine',
	'sliderThumb',
	'codeBlockHighlightLevel1',
	'codeBlockHighlightLevel2',
	'codeBlockHighlightLevel3',
];

export enum Icon {
	INPUT,
	SWITCH_OFF,
	SWITCH_ON,
}

export default function generate(
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['fill']
): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		...fillColors.flatMap<DrawingCommand>(color => {
			return [
				[Command.FILL_COLOR, colors[color]],
				[Command.RECTANGLE, 0, 0, characterWidth, characterHeight],
				[Command.TRANSLATE, characterWidth, 0],
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
