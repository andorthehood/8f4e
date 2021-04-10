import { SpriteLookup, SpriteCoordinates } from '../../2d-engine/src';

const offsetX = 0;
const offsetY = 100;

let lookupTable = {};

const defaultSprite: SpriteCoordinates = {
	x: 0,
	y: 0,
	spriteHeight: 1,
	spriteWidth: 1,
};

const generate = function (ctx: OffscreenCanvasRenderingContext2D) {
	for (let r = 0; r <= 255; r += 51) {
		for (let g = 0; g <= 255; g += 51) {
			for (let b = 0; b <= 255; b += 51) {
				ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
				const x = offsetX + (r / 51) * 4 + (b / 51) * 24;
				const y = offsetY + (g / 51) * 4;
				ctx.fillRect(x, y, 4, 4);
				lookupTable['rgb(' + r + ',' + g + ',' + b + ')'] = { x, y, spriteWidth: 4, spriteHeight: 4 };
			}
		}
	}
};

export default generate;

export const lookup: SpriteLookup = function (color) {
	return lookupTable[color] ? lookupTable[color] : defaultSprite;
};
