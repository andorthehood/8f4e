import { SpriteLookup } from '../../2dEngine/src';

const whiteKeyLeft = function (
	ctx: OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	cutX: number,
	cutY: number,
	fillColor: string,
	borderColor: string
) {
	ctx.fillStyle = fillColor;
	ctx.fillRect(0, 0, width - cutX, height);
	ctx.fillRect(0, cutY, width, height - cutY);

	ctx.fillStyle = borderColor;
	ctx.fillRect(0, 0, width - cutX, 1);
	ctx.fillRect(width - cutX - 1, 0, 1, cutY);
	ctx.fillRect(width - cutX, cutY, cutX, 1);
	ctx.fillRect(width - 1, cutY, 1, height - cutY);
	ctx.fillRect(0, height - 1, width, 1);
	ctx.fillRect(0, 0, 1, height);
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
	ctx.fillStyle = fillColor;
	ctx.fillRect(cutX, 0, width - cutX * 2, height);
	ctx.fillRect(0, cutY, width, height - cutY);

	ctx.fillStyle = borderColor;
	ctx.fillRect(cutX, 0, width - 2 * cutX, 1);
	ctx.fillRect(width - cutX - 1, 0, 1, cutY);
	ctx.fillRect(width - cutX, cutY, cutX, 1);
	ctx.fillRect(width - 1, cutY, 1, height - cutY);
	ctx.fillRect(0, height - 1, width, 1);
	ctx.fillRect(0, cutY, 1, height - cutY);
	ctx.fillRect(0, cutY, cutX, 1);
	ctx.fillRect(cutX, 0, 1, cutY);
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
	ctx.fillStyle = fillColor;
	ctx.fillRect(cutX, 0, width - cutX, height);
	ctx.fillRect(0, cutY, width, height - cutY);

	ctx.fillStyle = borderColor;
	ctx.fillRect(cutX, 0, width - cutX, 1);
	ctx.fillRect(width - 1, 0, 1, height);
	ctx.fillRect(0, height - 1, width, 1);
	ctx.fillRect(0, cutY, 1, height - cutY);
	ctx.fillRect(0, cutY, cutX, 1);
	ctx.fillRect(cutX, 0, 1, cutY);
};

const blackKey = function (
	ctx: OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	fillColor: string,
	borderColor: string
) {
	ctx.fillStyle = fillColor;
	ctx.fillRect(0, 0, width, height);

	ctx.fillStyle = borderColor;
	ctx.fillRect(0, 0, 1, height);
	ctx.fillRect(width - 1, 0, 1, height);
	ctx.fillRect(0, 0, width, 1);
	ctx.fillRect(0, height - 1, width, 1);
};

const orderedKeys = [
	whiteKeyLeft,
	whiteKeyMiddle,
	whiteKeyRight,
	whiteKeyLeft,
	whiteKeyMiddle,
	whiteKeyMiddle,
	whiteKeyRight,
];

const generateKeyboard = function (
	ctx: OffscreenCanvasRenderingContext2D,
	width: number,
	height: number,
	spacing: number,
	blackKeywidth: number,
	blackKeyHeight: number,
	whiteKeyFillColor: string,
	whiteKeyBorderColor: string,
	blackKeyFillColor: string,
	blackKeyBorderColor: string
): void {
	const cutX = (blackKeyWidth - spacing) / 2;
	const cutY = blackKeyHeight;
	const blackKeyOffsetRelativeToWhiteKey = width - cutX;

	orderedKeys.forEach(keyDrawer => {
		keyDrawer.call(this, ctx, width, height, cutX, cutY, whiteKeyFillColor, whiteKeyBorderColor);

		if ([whiteKeyLeft, whiteKeyMiddle].includes(keyDrawer)) {
			ctx.translate(blackKeyOffsetRelativeToWhiteKey, 0);
			blackKey(ctx, blackKeywidth, blackKeyHeight, blackKeyFillColor, blackKeyBorderColor);
			ctx.translate(-blackKeyOffsetRelativeToWhiteKey, 0);
		}

		ctx.translate(width + spacing, 0);
	});

	ctx.resetTransform();
};

const offsetX = 0;
const offsetY = 140;
const whiteKeyWidth = 18;
const whiteKeyHeight = 60;
const blackKeyHeight = 40;
const blackKeyWidth = 10;
const spacing = 2;
const keyboardWidth = (whiteKeyWidth + spacing) * orderedKeys.length;
const cutX = (blackKeyWidth - spacing) / 2;
const blackKeyOffsetRelativeToWhiteKey = whiteKeyWidth - cutX;

const generate = function (ctx: OffscreenCanvasRenderingContext2D): void {
	ctx.resetTransform();
	ctx.translate(offsetX, offsetY);
	generateKeyboard(
		ctx,
		whiteKeyWidth,
		whiteKeyHeight,
		spacing,
		blackKeyWidth,
		blackKeyHeight,
		'rgb(255, 255, 255)',
		'rgb(255, 255, 255)',
		'rgba(0, 0, 0',
		'rgba(0, 0, 0)'
	);

	ctx.translate(offsetX + keyboardWidth, offsetY);
	generateKeyboard(
		ctx,
		whiteKeyWidth,
		whiteKeyHeight,
		spacing,
		blackKeyWidth,
		blackKeyHeight,
		'rgb(0, 0, 0)',
		'rgb(255, 255, 255)',
		'rgba(255, 255, 255, 0)',
		'rgba(0, 0, 0, 0)'
	);

	ctx.translate(offsetX + keyboardWidth * 2, offsetY);
	generateKeyboard(
		ctx,
		whiteKeyWidth,
		whiteKeyHeight,
		spacing,
		blackKeyWidth,
		blackKeyHeight,
		'rgba(255, 255, 255, 0)',
		'rgba(0, 0, 0, 0)',
		'rgb(255, 255, 255)',
		'rgb(0, 0, 0)'
	);

	ctx.translate(offsetX + keyboardWidth * 3, offsetY);
	generateKeyboard(
		ctx,
		whiteKeyWidth,
		whiteKeyHeight,
		spacing,
		blackKeyWidth,
		blackKeyHeight,
		'rgb(255, 0, 0)',
		'rgb(255, 255, 255)',
		'rgba(255, 255, 255, 0)',
		'rgba(0, 0, 0, 0)'
	);

	ctx.translate(offsetX + keyboardWidth * 4, offsetY);
	generateKeyboard(
		ctx,
		whiteKeyWidth,
		whiteKeyHeight,
		spacing,
		blackKeyWidth,
		blackKeyHeight,
		'rgba(255, 255, 255, 0)',
		'rgba(0, 0, 0, 0)',
		'rgb(255, 0, 0)',
		'rgb(0, 0, 0)'
	);
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
				x: offsetX + (whiteKeyWidth + spacing) * index + (isHighlighted ? keyboardWidth : 0),
				y: offsetY,
				spriteWidth: whiteKeyWidth,
				spriteHeight: whiteKeyHeight,
			};
		}

		return {
			x: offsetX + blackKeyOffsetRelativeToWhiteKey + (isHighlighted ? keyboardWidth * 2 : 0),
			y: offsetY,
			spriteWidth: blackKeyWidth,
			spriteHeight: blackKeyHeight,
		};
	};
};
