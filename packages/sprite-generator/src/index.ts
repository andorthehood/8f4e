import generateFont from './font';
import generateFillColors from './fillColors';
import generateFeedbackScale from './feedbackScale';
import generateScope from './scope';
import generatePianoKeyboard from './pianoKeyboard';
import { Command } from './types';

export { lookup as feedbackScale } from './feedbackScale';
export { lookup as fillColor } from './fillColors';
export { lookup as font } from './font';
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

	const ctx: OffscreenCanvasRenderingContext2D = canvas.getContext('2d');

	const commands = [
		...generateScope(),
		...generateFillColors(),
		...generateFeedbackScale(),
		...generateFont(),
		...generatePianoKeyboard(),
	];

	commands.forEach(([command, ...params]) => {
		switch (command) {
			case Command.FILL_COLOR:
				ctx.fillStyle = <string>params[0];
				break;
			case Command.RECTANGLE:
				ctx.fillRect(...params);
				break;
			case Command.RESET_TRANSFORM:
				ctx.resetTransform();
				break;
			case Command.TRANSLATE:
				ctx.translate(...params);
				break;
			case Command.PIXEL:
				ctx.fillRect(...params, 1, 1);
				break;
		}
	});

	return canvas;
}
