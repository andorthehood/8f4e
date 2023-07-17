import { SpriteCoordinates } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import glyphs from './fonts/8x16/glyphs';
import { Glyph } from './fonts/types';
import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 300;

export default function generate(
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['fill']
): DrawingCommand[] {
	const commands: DrawingCommand[] = [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, colors.backgroundDots],
	];

	for (let i = 0; i < 32; i++) {
		for (let j = 0; j < 64; j++) {
			commands.push(...drawCharacter(glyphs, Glyph.DOT, characterWidth, characterHeight), [
				Command.TRANSLATE,
				characterWidth,
				0,
			]);
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
