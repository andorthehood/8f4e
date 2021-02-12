import generateFont from './generateFonts';
import generateFillColors from './generateFillColors';
export { getGlyphInfo } from './generateFonts';

const generateSprite = async function (): Promise<{
	canvas: OffscreenCanvas | HTMLCanvasElement;
	lookupFunction: (sprite: string) => any;
}> {
	let canvas;

	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(1024, 1024);
	} else {
		canvas = document.createElement('canvas');
		canvas.width = 1024;
		canvas.height = 1024;
	}

	const ctx = canvas.getContext('2d');

	const lookupTable = {
		...generateFont(ctx, 0, 0),
		...generateFillColors(ctx, 0, 100),
	};

	console.log(lookupTable);

	const lookupFunction = function (sprite: string) {
		return lookupTable[sprite] || { x: 0, y: 0, spriteWidth: 0, spriteHeight: 0 };
	};

	return { canvas, lookupFunction };
};

export default generateSprite;
