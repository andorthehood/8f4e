import { SpriteLookup } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import glyphs, { Glyph } from './fonts/8x16/glyphs';
import { ColorScheme, Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 300;

export default function generate(colors: ColorScheme['fill']): DrawingCommand[] {
	const commands: DrawingCommand[] = [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, colors.backgroundDots],
	];

	for (let i = 0; i < 32; i++) {
		commands.push([Command.TRANSLATE, 8, 0]);
		for (let j = 0; j < 32; j++) {
			commands.push(...drawCharacter(glyphs, Glyph.DOT, 8, 16), [Command.TRANSLATE, 16, 0]);
		}
		commands.push([Command.TRANSLATE, -16 * 32 - 8, 16]);
	}

	return commands;
}

export const lookup: SpriteLookup = function () {
	return {
		x: offsetX,
		y: offsetY,
		spriteWidth: 32 * 16,
		spriteHeight: 32 * 16,
	};
};
