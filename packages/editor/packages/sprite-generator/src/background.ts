import { SpriteCoordinates } from 'glugglug';

import { drawCharacter } from './font';
import Glyph from './fonts/types';
import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 300;

export default function generate(
	glyphs: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['fill']
): DrawingCommand[] {
	const commands: DrawingCommand[] = [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, colors.background],
		[Command.RECTANGLE, 0, 0, characterWidth * 64, characterHeight * 32],
	];

	for (let i = 0; i < 32; i++) {
		for (let j = 0; j < 64; j++) {
			commands.push(
				j % 2 === 0 && i % 1 === 0
					? [Command.FILL_COLOR, colors.backgroundDots2]
					: [Command.FILL_COLOR, colors.backgroundDots],
				...drawCharacter(glyphs, Glyph.DOT, characterWidth, characterHeight),
				[Command.TRANSLATE, characterWidth, 0]
			);
		}
		commands.push([Command.TRANSLATE, -characterWidth * 64, characterHeight]);
	}

	return commands;
}

export const generateLookup = function (characterWidth: number, characterHeight: number): Record<0, SpriteCoordinates> {
	return {
		0: {
			x: offsetX,
			y: offsetY,
			spriteWidth: 64 * characterWidth,
			spriteHeight: 32 * characterHeight,
		},
	};
};
