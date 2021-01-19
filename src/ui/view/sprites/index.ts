import generateFont from './generateFonts';
import generateFillColors from './generateFillColors';
export { getGlyphInfo } from './generateFonts';

const generateSprite = async function (): Promise<{
	canvas: OffscreenCanvas;
	lookupFunction: (sprite: string) => any;
}> {
	const canvas = new OffscreenCanvas(256, 256);
	const ctx = canvas.getContext('2d');

	const lookupTable = {
		...generateFont(ctx, 0, 0),
		...generateFillColors(ctx, 100, 100),
	};

	const lookupFunction = function (sprite: string) {
		return lookupTable[sprite];
	};

	const blob = await canvas.convertToBlob({
		type: 'image/png',
	});
	const src = URL.createObjectURL(blob);

	console.log(src);

	// const image = document.createElement('img');
	// image.src = src;
	// document.body.appendChild(image);

	return { canvas, lookupFunction };
};

export default generateSprite;
