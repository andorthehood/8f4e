import { SpriteCoordinates } from 'glugglug';

import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 130;

export function getFeedbackScaleColors(colors: ColorScheme['icons']): string[] {
	return [
		colors.feedbackScale0,
		colors.feedbackScale1,
		colors.feedbackScale2,
		colors.feedbackScale3,
		colors.feedbackScale4,
		colors.feedbackScale5,
	].filter(color => color.trim().length > 0);
}

export default function generate(
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	const feedbackScaleColors = getFeedbackScaleColors(colors);

	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],

		...feedbackScaleColors.flatMap<DrawingCommand>(color => {
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
	colors: ColorScheme['icons']
): Record<number, SpriteCoordinates> {
	const feedbackScaleColors = getFeedbackScaleColors(colors);

	return Object.fromEntries(
		feedbackScaleColors.map((_color, index) => {
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
