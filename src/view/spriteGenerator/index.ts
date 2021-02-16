import generateFont from './generateFonts';
import generateFillColors from './generateFillColors';
import generateFeedbackScale from './generateFeedbackScale';
import generateModules from './modules';
export { lookup as feedbackScale } from './generateFeedbackScale';
export { lookup as fillColor } from './generateFillColors';
export { lookup as font } from './generateFonts';
export { lookup as modules } from './modules';

const generateSprite = async function (): Promise<OffscreenCanvas | HTMLCanvasElement> {
	let canvas;

	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(1024, 1024);
	} else {
		canvas = document.createElement('canvas');
		canvas.width = 1024;
		canvas.height = 1024;
	}

	const ctx = canvas.getContext('2d');

	generateFeedbackScale(ctx);
	generateFont(ctx);
	generateFillColors(ctx);
	generateModules(ctx);

	return canvas;
};

export default generateSprite;
