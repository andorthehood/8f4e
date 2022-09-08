import { SpriteLookup } from '@8f4e/2d-engine';
import { drawCharacter } from './font';
import thickIcons, { Icon } from './fonts/thickIcons';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 130;

export default function generate(): DrawingCommand[] {
	return [
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, '#c9d487'],
		[Command.RECTANGLE, 0, 0, 16 * 8, 16],

		[Command.FILL_COLOR, '#5cab5e'],
		...drawCharacter(thickIcons, Icon.FILL, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.FILL, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.SEMI_FILL, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.SEMI_FILL, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_1, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_1, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_2, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_2, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_3, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_3, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_4, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_4, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_5, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_5, 8, 16),
	];
}

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX + Math.floor(((scale + 32768) / 65535) * 8) * 16,
		y: offsetY,
		spriteWidth: 16,
		spriteHeight: 16,
	};
};
