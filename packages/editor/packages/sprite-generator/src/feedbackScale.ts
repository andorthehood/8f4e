import { SpriteCoordinates } from 'glugglug';

import { createAtlasLayout } from './atlasLayout';
import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';

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
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, layout.feedbackScale.x, layout.feedbackScale.y],

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
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return Object.fromEntries(
		feedbackScaleColors.map((_color, index) => {
			return [
				index,
				{
					x: layout.feedbackScale.x + index * (characterWidth * 3),
					y: layout.feedbackScale.y,
					spriteWidth: characterWidth * 3,
					spriteHeight: characterHeight,
				},
			];
		})
	);
};
