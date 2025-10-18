import { SpriteCoordinates } from 'glugglug';

import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 130;

export default function generate(
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],

		...colors.feedbackScale.flatMap<DrawingCommand>(color => {
			return [
				[Command.FILL_COLOR, colors.outputConnectorBackground],
				[Command.RECTANGLE, 0, 0, characterWidth * 3, characterHeight],
				[Command.FILL_COLOR, colors.outputConnector],
				...drawCharacter(font, '[', characterWidth, characterHeight),
				[Command.TRANSLATE, characterWidth, 0],
				[Command.FILL_COLOR, color],
				...drawCharacter(font, '*', characterWidth, characterHeight),
				[Command.TRANSLATE, characterWidth, 0],
				[Command.FILL_COLOR, colors.outputConnector],
				...drawCharacter(font, ']', characterWidth, characterHeight),
				[Command.TRANSLATE, characterWidth, 0],
			];
		}),
	];
}

export const generateLookup = function (
	characterWidth: number,
	characterHeight: number,
	feedbackScale: ColorScheme['icons']['feedbackScale']
): Record<number, SpriteCoordinates> {
	return Object.fromEntries(
		feedbackScale.map((color, index) => {
			return [
				index,
				{
					x: offsetX + index * (characterWidth * 3),
					y: offsetY,
					spriteWidth: characterWidth * 3,
					spriteHeight: characterHeight,
				},
			];
		})
	);
};
