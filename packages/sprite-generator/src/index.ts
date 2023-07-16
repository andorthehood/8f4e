import generateFont from './font';
import generateFillColors from './fillColors';
import generateFeedbackScale from './feedbackScale';
import generateScope from './scope';
import generateBackground from './background';
import generateIcons from './icons';
import { Command, Config } from './types';
export { lookup as feedbackScale } from './feedbackScale';
export { lookup as fillColor } from './fillColors';
export { lookup as font } from './font';
export { lookup as scope } from './scope';
export { lookup as background } from './background';
export { lookup as icons } from './icons';
import ascii from './fonts/8x16/ascii';
export { Glyph } from './fonts/types';
export { Icon } from './icons';
export { ColorScheme } from './types';

export default function generateSprite(config: Config): OffscreenCanvas | HTMLCanvasElement {
	let canvas: OffscreenCanvas | HTMLCanvasElement;

	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(1024, 1024);
	} else {
		canvas = document.createElement('canvas');
		canvas.width = 1024;
		canvas.height = 1024;
	}

	// @ts-ignore
	const ctx = canvas.getContext('2d', {
		alpha: true,
		antialias: false,
	}) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

	const commands = [
		...generateScope(),
		...generateFillColors(config.colorScheme.fill),
		...generateFeedbackScale(ascii, 8, 16, config.colorScheme.icons),
		...generateFont(ascii, 8, 16, config.colorScheme.text),
		...generateBackground(config.colorScheme.fill),
		...generateIcons(ascii, 8, 16, config.colorScheme.icons),
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
