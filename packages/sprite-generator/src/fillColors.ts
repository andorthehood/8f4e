import { SpriteLookup, SpriteCoordinates } from '@8f4e/2d-engine';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 100;

const lookupTable = {};

const defaultSprite: SpriteCoordinates = {
	x: 0,
	y: 0,
	spriteHeight: 1,
	spriteWidth: 1,
};

export default function generate(): DrawingCommand[] {
	const commands = [];
	for (let r = 0; r <= 255; r += 51) {
		for (let g = 0; g <= 255; g += 51) {
			for (let b = 0; b <= 255; b += 51) {
				commands.push([Command.FILL_COLOR, 'rgb(' + r + ',' + g + ',' + b + ')']);
				const x = offsetX + (r / 51) * 4 + (b / 51) * 24;
				const y = offsetY + (g / 51) * 4;
				commands.push([Command.RECTANGLE, x, y, 4, 4]);
				lookupTable['rgb(' + r + ',' + g + ',' + b + ')'] = { x, y, spriteWidth: 4, spriteHeight: 4 };
			}
		}
	}
	return [[Command.RESET_TRANSFORM], ...commands];
}

export const lookup: SpriteLookup = function (color: string) {
	return lookupTable[color] ? lookupTable[color] : defaultSprite;
};
