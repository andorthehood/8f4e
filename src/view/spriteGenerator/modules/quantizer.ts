import { SpriteLookup } from '../../engine';

const offsetX = 1;
const offsetY = 140;

const generateBox = function (ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.fillStyle = 'rgb(100,100,100)';
	const width = 300 - 1;
	const height = 100 - 1;
	ctx.fillRect(0, 0, 1, height);
	ctx.fillRect(width, 0, 1, height);
	ctx.fillRect(0, 0, width, 1);
	ctx.fillRect(0, height, width, 1);
};

const generateWhiteKeys = function (ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.fillStyle = 'rgb(200,200,200)';
	const whiteKeyLeft = function (width = 20, height = 70, cutX = 5, cutY = 40) {
		width--;
		ctx.fillRect(0, 0, 1, height);
		ctx.fillRect(width - cutX, 0, 1, cutY);
		ctx.fillRect(width, cutY, 1, height - cutY);

		ctx.fillRect(0, 0, width - cutX, 1);
		ctx.fillRect(width - cutX, cutY, cutX, 1);
		ctx.fillRect(0, height, width, 1);
	};

	const whiteKeyMiddle = function (width = 20, height = 70, cutX = 5, cutY = 40) {
		width--;
		ctx.fillRect(0, cutY, 1, height - cutY);
		ctx.fillRect(cutX, 0, 1, cutY);
		ctx.fillRect(width - cutX, 0, 1, cutY);
		ctx.fillRect(width, cutY, 1, height - cutY);

		ctx.fillRect(cutX, 0, width - 2 * cutX, 1);
		ctx.fillRect(0, cutY, cutX, 1);
		ctx.fillRect(width - cutX, cutY, cutX, 1);
		ctx.fillRect(0, height, width, 1);
	};

	const whiteKeyRight = function (width = 20, height = 70, cutX = 5, cutY = 40) {
		width--;
		ctx.fillRect(0, cutY, 1, height - cutY);
		ctx.fillRect(cutX, 0, 1, cutY);
		ctx.fillRect(width, 1, 1, height);

		ctx.fillRect(cutX, 0, width - cutX, 1);
		ctx.fillRect(0, cutY, cutX, 1);
		ctx.fillRect(0, height, width, 1);
	};

	const spacing = 24;

	whiteKeyLeft();
	ctx.translate(spacing, 0);
	whiteKeyMiddle();
	ctx.translate(spacing, 0);
	whiteKeyRight();
	ctx.translate(spacing, 0);
	whiteKeyLeft();
	ctx.translate(spacing, 0);
	whiteKeyMiddle();
	ctx.translate(spacing, 0);
	whiteKeyMiddle();
	ctx.translate(spacing, 0);
	whiteKeyRight();
};

const generate = function (ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.resetTransform();
	ctx.translate(offsetX, offsetY);
	generateBox(ctx);
	ctx.translate(50, 20);
	//generateWhiteKeys(ctx);
};

export default generate;

export const lookup: SpriteLookup = function (scale: number) {
	return {
		x: offsetX,
		y: offsetY,
		spriteWidth: 300,
		spriteHeight: 100,
	};
};
