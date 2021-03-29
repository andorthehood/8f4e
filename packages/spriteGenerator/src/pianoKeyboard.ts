import { SpriteLookup } from 'glugglugglug';

const whiteKeyLeft = function (
	ctx: OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	fillColor: string,
	borderColor: string
) {
	ctx.fillStyle = borderColor;
	width--;
	ctx.fillRect(0, 0, 1, height);
	ctx.fillRect(width - cutX, 0, 1, cutY);
	ctx.fillRect(width, cutY, 1, height - cutY);

	ctx.fillRect(0, 0, width - cutX, 1);
	ctx.fillRect(width - cutX, cutY, cutX, 1);
	ctx.fillRect(0, height, width, 1);

	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fillRect(1, 1, width - cutX - 1, height - 1);
		ctx.fillRect(1, cutY + 1, width - 1, height - cutY - 1);
	}
};

const whiteKeyMiddle = function (
	ctx: OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	fillColor: string,
	borderColor: string
) {
	ctx.fillStyle = borderColor;
	width--;
	ctx.fillRect(0, cutY, 1, height - cutY);
	ctx.fillRect(cutX, 0, 1, cutY);
	ctx.fillRect(width - cutX, 0, 1, cutY);
	ctx.fillRect(width, cutY, 1, height - cutY);

	ctx.fillRect(cutX, 0, width - 2 * cutX, 1);
	ctx.fillRect(0, cutY, cutX, 1);
	ctx.fillRect(width - cutX, cutY, cutX, 1);
	ctx.fillRect(0, height, width, 1);

	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fillRect(cutX + 1, 1, width - 1 - cutX * 2, height - 1);
		ctx.fillRect(1, cutY + 1, width - 1, height - cutY - 1);
	}
};

const whiteKeyRight = function (
	ctx: OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	fillColor: string,
	borderColor: string
) {
	ctx.fillStyle = borderColor;
	width--;
	ctx.fillRect(0, cutY, 1, height - cutY);
	ctx.fillRect(cutX, 0, 1, cutY);
	ctx.fillRect(width, 1, 1, height);

	ctx.fillRect(cutX, 0, width - cutX, 1);
	ctx.fillRect(0, cutY, cutX, 1);
	ctx.fillRect(0, height, width, 1);

	if (fillColor) {
		ctx.fillStyle = fillColor;
		ctx.fillRect(cutX + 1, 1, width - cutX - 1, height - 1);
		ctx.fillRect(1, cutY + 1, width - 1, height - cutY - 1);
	}
};

const generateWhiteKeys = function (
	ctx: OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	spacing: number,
	fillColor: string = 'rgb(255,255,255)',
	borderColor: string = 'rgb(255,255,255)'
): void {
	whiteKeyLeft(ctx, width, height, cutX, cutY, fillColor, borderColor);
	ctx.translate(width + spacing, 0);
	whiteKeyMiddle(ctx, width, height, cutX, cutY, fillColor, borderColor);
	ctx.translate(width + spacing, 0);
	whiteKeyRight(ctx, width, height, cutX, cutY, fillColor, borderColor);
	ctx.translate(width + spacing, 0);
	whiteKeyLeft(ctx, width, height, cutX, cutY, fillColor, borderColor);
	ctx.translate(width + spacing, 0);
	whiteKeyMiddle(ctx, width, height, cutX, cutY, fillColor, borderColor);
	ctx.translate(width + spacing, 0);
	whiteKeyMiddle(ctx, width, height, cutX, cutY, fillColor, borderColor);
	ctx.translate(width + spacing, 0);
	whiteKeyRight(ctx, width, height, cutX, cutY, fillColor, borderColor);
};

const offsetX = 0;
const offsetY = 140;
const whiteKeyWidth = 18;
const whiteKeyHeight = 60;
const cutX = 5;
const cutY = 40;
const spacing = 2;

const generate = function (ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.resetTransform();
	ctx.translate(offsetX, offsetY);
	generateWhiteKeys(ctx, whiteKeyWidth, whiteKeyHeight, cutX, cutY, spacing);

	ctx.resetTransform();
	ctx.translate(offsetX + 140, offsetY);
	generateWhiteKeys(ctx, whiteKeyWidth, whiteKeyHeight, cutX, cutY, spacing, 'rgb(0, 0, 0)', 'rgb(255, 255, 255)');
};

export default generate;

const getWhiteKeyIndex = function (note: number) {
	const whiteKeys = [0, 2, 4, 5, 7, 9, 11];
	return whiteKeys.indexOf(note % 12);
};

export const lookup = function (isHighlighted: boolean = false): SpriteLookup {
	return function (key) {
		if (typeof key !== 'number') {
			return {
				x: offsetX,
				y: offsetY,
				spriteWidth: 140,
				spriteHeight: 60,
			};
		}

		const index = getWhiteKeyIndex(key);

		if (index !== -1) {
			return {
				x: offsetX + whiteKeyWidth * index + spacing * index + (isHighlighted ? 140 : 0),
				y: offsetY,
				spriteWidth: whiteKeyWidth,
				spriteHeight: whiteKeyHeight,
			};
		}

		return {
			x: 0,
			y: 0,
			spriteWidth: 1,
			spriteHeight: 1,
		};
	};
};
