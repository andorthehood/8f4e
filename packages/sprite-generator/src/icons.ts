import { SpriteCoordinates } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 150;

const icons = ['[ ]', '[# ]', '[ #]'];

export enum Icon {
	INPUT,
	SWITCH_OFF,
	SWITCH_ON,
}

export default function generate(
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		...icons.flatMap<DrawingCommand>(icon => {
			return [
				[Command.FILL_COLOR, colors.inputConnectorBackground],
				[Command.RECTANGLE, 0, 0, characterWidth * icon.length, characterHeight],
				[Command.FILL_COLOR, colors.inputConnector],
				...icon.split('').flatMap<DrawingCommand>(char => {
					return [
						...drawCharacter(font, char, characterWidth, characterHeight),
						[Command.TRANSLATE, characterWidth, 0],
					];
				}),
			];
		}),
	];
}

function generateIconPositions(characterWidth: number) {
	return icons.reduce((acc, current) => {
		const length = acc.reduce((acc, icon) => acc + icon[2], 0);
		acc.push([offsetX + length, offsetY, current.length * characterWidth]);
		return acc;
	}, [] as number[][]);
}
export const generateLookup = function (characterWidth: number, characterHeight: number) {
	const iconPositions = generateIconPositions(characterWidth);

	return Object.fromEntries(
		icons.map((icon, index) => {
			return [
				index,
				{
					x: iconPositions[index][0],
					y: iconPositions[index][1],
					spriteWidth: iconPositions[index][2],
					spriteHeight: characterHeight,
				},
			];
		})
	) as Record<Icon, SpriteCoordinates>;
};
