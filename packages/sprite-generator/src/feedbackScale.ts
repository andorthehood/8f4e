import { SpriteLookup } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import thickIcons, { Icon } from './fonts/icons';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 130;

export default function generate(): DrawingCommand[] {
	return [
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, '#0000ff'],
		[Command.RECTANGLE, 0, 0, 16 * 8, 16],

		[Command.FILL_COLOR, '#ff0000'],

		[Command.TRANSLATE, 16, 0],

		...drawCharacter(thickIcons, Icon.DITHER_5, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_5, 8, 16),
		[Command.TRANSLATE, 8, 0],

		...drawCharacter(thickIcons, Icon.DITHER_4, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_4, 8, 16),
		[Command.TRANSLATE, 8, 0],

		...drawCharacter(thickIcons, Icon.DITHER_3, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_3, 8, 16),
		[Command.TRANSLATE, 8, 0],

		...drawCharacter(thickIcons, Icon.DITHER_2, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_2, 8, 16),

		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_1, 8, 16),
		[Command.TRANSLATE, 8, 0],
		...drawCharacter(thickIcons, Icon.DITHER_1, 8, 16),
		[Command.TRANSLATE, 8, 0],

		[Command.FILL_COLOR, '#ff0000'],
		[Command.RECTANGLE, 0, 0, 16 * 8, 16],

		[Command.FILL_COLOR, '#0000ff'],
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
		x: offsetX + Math.round(scale * 13) * 16,
		y: offsetY,
		spriteWidth: 16,
		spriteHeight: 16,
	};
};
