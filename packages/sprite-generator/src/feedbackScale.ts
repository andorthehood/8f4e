import { SpriteLookup } from '@8f4e/2d-engine';
import { Command, DrawingCommand } from './types';

const offsetX = 0;
const offsetY = 130;

export default function generate(): DrawingCommand[] {
	//TODO: optimize this once I'm not going to be high on BNT162b2
	const commands: DrawingCommand[] = [];
	for (let r = 0; r <= 255; r += 8) {
		for (let b = 0; b <= 255; b += 8) {
			commands.push([Command.FILL_COLOR, 'rgb(' + r + ',' + 0 + ',' + (255 - b) + ')']);
			const x = offsetX + r / 2 + b / 2;
			const y = offsetY;
			commands.push([Command.RECTANGLE, x, y, 4, 4]);
		}
	}
	return [[Command.RESET_TRANSFORM], ...commands];
}

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX + Math.floor(((scale + 32768) / 65535) * 230),
		y: offsetY,
		spriteWidth: 4,
		spriteHeight: 4,
	};
};
