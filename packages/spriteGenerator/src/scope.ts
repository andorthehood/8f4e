import { SpriteLookup } from 'glugglugglug';

const offsetX = 300;
const offsetY = 0;

const generate = function (ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.resetTransform();
	ctx.translate(offsetX, offsetY);
	ctx.fillStyle = 'rgb(100,255,255)';
	for (let i = 0; i <= 80; i += 1) {
		ctx.fillRect(i * 4, 80 - i, 4, 1);
	}
};

export default generate;

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX + Math.floor(((scale + 32768) / 65535) * 80) * 4,
		y: offsetY,
		spriteWidth: 4,
		spriteHeight: 80,
	};
};
