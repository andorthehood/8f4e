import generateFont from './font';
import generateFillColors from './fillColors';
import generateFeedbackScale from './feedbackScale';
import generateScope from './scope';
import generatePianoKeyboard from './pianoKeyboard';

export { lookup as feedbackScale } from './feedbackScale';
export { lookup as fillColor } from './fillColors';
export { lookup as font } from './font';
export { lookup as modules } from './modules';
export { lookup as scope } from './scope';
export { lookup as pianoKeyboard } from './pianoKeyboard';

export default function generateSprite(): Promise<OffscreenCanvas | HTMLCanvasElement> {
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
	generateScope(ctx);
	generatePianoKeyboard(ctx);

	return canvas;
}
