import { SpriteLookup } from '@8f4e/2d-engine';

import { drawCharacter } from './font';
import thickIcons, { Icon } from './fonts/icons';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 300;

export default function generate(): DrawingCommand[] {
	const commands: DrawingCommand[] = [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, '#333333'],
	];

	for (let i = 0; i < 32; i++) {
		for (let j = 0; j < 32; j++) {
			commands.push(...drawCharacter(thickIcons, Icon.DOT, 8, 16), [Command.TRANSLATE, 16, 0]);
		}
		commands.push([Command.TRANSLATE, -16 * 32, 16]);
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
