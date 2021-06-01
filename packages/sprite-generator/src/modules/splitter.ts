import { SpriteLookup } from '../../../2d-engine/src';

const offsetX = 0;
const offsetY = 250;

const generateBox = function (ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.fillStyle = 'rgb(100,100,100)';
	const width = 100 - 1;
	const height = 100 - 1;
	ctx.fillRect(0, 0, 1, height);
	ctx.fillRect(width, 0, 1, height);
	ctx.fillRect(0, 0, width, 1);
	ctx.fillRect(0, height, width, 1);
};

export default function generate(ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.resetTransform();
	ctx.translate(offsetX, offsetY);
	generateBox(ctx);
}

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX,
		y: offsetY,
		spriteWidth: 100,
		spriteHeight: 100,
	};
};
