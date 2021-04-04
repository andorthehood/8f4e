import { SpriteLookup } from '../../2dEngine/src';

const offsetX = 0;
const offsetY = 130;

const generate = function (ctx: OffscreenCanvasRenderingContext2D): void {
	for (let r = 0; r <= 255; r += 8) {
		for (let b = 0; b <= 255; b += 8) {
			ctx.fillStyle = 'rgb(' + r + ',' + 0 + ',' + (255 - b) + ')';
			const x = offsetX + r / 2 + b / 2;
			const y = offsetY;
			ctx.fillRect(x, y, 4, 4);
		}
	}
};

export default generate;

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX + Math.floor(((scale + 32768) / 65535) * 230),
		y: offsetY,
		spriteWidth: 4,
		spriteHeight: 4,
	};
};
