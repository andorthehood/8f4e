import { SpriteLookup } from '@8f4e/2d-engine';

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

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX + Math.round(scale * 5) * (8 * 3),
		y: offsetY,
		spriteWidth: 8 * 3,
		spriteHeight: 16,
	};
};
