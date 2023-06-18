import { SpriteLookup } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';
import font from './fonts/font';

const offsetX = 0;
const offsetY = 130;

export default function generate(colors: ColorScheme['icons']): DrawingCommand[] {
	return [
		[Command.TRANSLATE, offsetX, offsetY],

		...colors.feedbackScale.flatMap<DrawingCommand>(color => {
			return [
				[Command.FILL_COLOR, colors.outputConnectorBackground],
				[Command.RECTANGLE, 0, 0, 8 * 3, 16],
				[Command.FILL_COLOR, colors.outputConnector],
				...drawCharacter(font, '[', 8, 16),
				[Command.TRANSLATE, 8, 0],
				[Command.FILL_COLOR, color],
				...drawCharacter(font, '*', 8, 16),
				[Command.TRANSLATE, 8, 0],
				[Command.FILL_COLOR, colors.outputConnector],
				...drawCharacter(font, ']', 8, 16),
				[Command.TRANSLATE, 8, 0],
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
