import { SpriteCoordinates } from '@8f4e/2d-engine';

import { Command, DrawingCommand, SpriteLookupGenerator } from './types';

const offsetX = 600;
const offsetY = 100;

const values = new Array(80).fill(0).map((item, index) => index);

export default function generate(): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		[Command.FILL_COLOR, 'rgb(100,255,255)'],
		...values.map((value): DrawingCommand => {
			return [Command.RECTANGLE, value * 4, 80 - value, 4, 1];
		}),
	];
}

export const generateLookup = function (): Record<number, SpriteCoordinates> {
	return Object.fromEntries(
		values.map(value => [
			value,
			{
				x: offsetX + value * 4,
				y: offsetY,
				spriteWidth: 4,
				spriteHeight: 80,
			},
		])
	);
};
