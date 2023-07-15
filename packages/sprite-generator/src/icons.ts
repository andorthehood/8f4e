import { SpriteLookup } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';
import ascii from './fonts/8x16/ascii';

const offsetX = 0;
const offsetY = 150;

const icons = ['[ ]', '[# ]', '[ #]'];

export enum Icon {
	INPUT,
	SWITCH_OFF,
	SWITCH_ON,
}

export default function generate(colors: ColorScheme['icons']): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		...icons.flatMap<DrawingCommand>(icon => {
			return [
				[Command.FILL_COLOR, colors.inputConnectorBackground],
				[Command.RECTANGLE, 0, 0, 8 * icon.length, 16],
				[Command.FILL_COLOR, colors.inputConnector],
				...icon.split('').flatMap<DrawingCommand>(char => {
					return [...drawCharacter(ascii, char, 8, 16), [Command.TRANSLATE, 8, 0]];
				}),
			];
		}),
	];
}

const iconPositions = icons.reduce((acc, current) => {
	const length = acc.reduce((acc, icon) => acc + icon[2], 0);
	acc.push([offsetX + length, offsetY, current.length * 8]);
	return acc;
}, [] as number[][]);

export const lookup: SpriteLookup = function (icon: Icon) {
	return {
		x: iconPositions[icon][0],
		y: iconPositions[icon][1],
		spriteWidth: iconPositions[icon][2],
		spriteHeight: 16,
	};
};
