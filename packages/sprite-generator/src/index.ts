import generateFont from './font';
import generateFillColors from './fillColors';
import generateFeedbackScale from './feedbackScale';
import generateScope from './scope';
import generatePianoKeyboard2 from './pianoKeyboard';
import generateBackground from './background';
import generateIcons from './icons';
import { Command, Config } from './types';

export { lookup as feedbackScale } from './feedbackScale';
export { lookup as fillColor } from './fillColors';
export { lookup as font } from './font';
export { lookup as scope } from './scope';
export { lookup as pianoKeyboard } from './pianoKeyboard';
export { lookup as background } from './background';
export { lookup as icons } from './icons';

export { Glyph } from './fonts/glyphs';
export { Mosaic } from './fonts/mosaic';
export { Icon } from './icons';

export { ColorScheme } from './types';

export default function generateSprite(config: Config): Promise<OffscreenCanvas | HTMLCanvasElement> {
	let canvas;

	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(1024, 1024);
	} else {
		canvas = document.createElement('canvas');
		canvas.width = 1024;
		canvas.height = 1024;
	}

	const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

	const commands = [
		...generateScope(),
		...generateFillColors(config.colorScheme.fill),
		...generateFeedbackScale(config.colorScheme.icons),
		...generateFont(config.colorScheme.text),
		...generatePianoKeyboard2(),
		...generateBackground(config.colorScheme.fill),
		...generateIcons(config.colorScheme.icons),
	];

	commands.forEach(([command, ...params]) => {
		switch (command) {
			case Command.FILL_COLOR:
				ctx.fillStyle = <string>params[0];
				break;
			case Command.RECTANGLE:
				ctx.fillRect(...(params as [number, number, number, number]));
				break;
			case Command.SAVE:
				ctx.save();
				break;
			case Command.RESET_TRANSFORM:
				ctx.resetTransform();
				break;
			case Command.RESTORE:
				ctx.restore();
				break;
			case Command.TRANSLATE:
				ctx.translate(...(params as [number, number]));
				break;
			case Command.PIXEL:
				ctx.fillRect(...(params as [number, number]), 1, 1);
				break;
		}
	});

	return canvas;
}
