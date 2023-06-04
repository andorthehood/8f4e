import { SpriteLookup } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';
import font from './fonts/font';

const offsetX = 0;
const offsetY = 130;

export default function generate(scale: ColorScheme['icons']['feedbackScale']): DrawingCommand[] {
	return [
		[Command.TRANSLATE, offsetX, offsetY],

		...scale.flatMap<DrawingCommand>(color => {
			return [[Command.FILL_COLOR, color], ...drawCharacter(font, '*', 8, 16), [Command.TRANSLATE, 8, 0]];
		}),
	];
}

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX + Math.round(scale * 5) * 8,
		y: offsetY,
		spriteWidth: 8,
		spriteHeight: 16,
	};
};
