import { SpriteLookup } from '@8f4e/2d-engine';

import { Command, DrawingCommand } from './types';

const offsetX = 600;
const offsetY = 100;

export default function generate(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, 'rgb(100,255,255)'],
		...new Array(80).fill(0).map((item, index): DrawingCommand => {
			return [Command.RECTANGLE, index * 4, 80 - index, 4, 1];
		}),
	];
}

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX + Math.floor(((scale + 32768) / 65535) * 80) * 4,
		y: offsetY,
		spriteWidth: 4,
		spriteHeight: 80,
	};
};
