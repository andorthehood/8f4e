import generateFont from './generateFonts';
import generateFillColors from './generateFillColors';
export { getGlyphInfo } from './generateFonts';

const generateSprite = async function (): Promise<{
	canvas: OffscreenCanvas | HTMLCanvasElement;
	lookupFunction: (sprite: string) => any;
}> {
	let canvas;

	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(256, 256);
	} else {
		canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 256;
	}

	const ctx = canvas.getContext('2d');

	const lookupTable = {
		...generateFont(ctx, 0, 0),
		...generateFillColors(ctx, 100, 100),
	};

	const lookupFunction = function (sprite: string) {
		return lookupTable[sprite] || { x: 0, y: 0, spriteWidth: 0, spriteHeight: 0 };
	};

	// const blob = await canvas.convertToBlob({
	// 	type: 'image/png',
	// });
	// const src = URL.createObjectURL(blob);

	//console.log(src);
	console.log(lookupTable);

	// const image = document.createElement('img');
	// image.src = src;
	// document.body.appendChild(image);

	return { canvas, lookupFunction };
};

export default generateSprite;
