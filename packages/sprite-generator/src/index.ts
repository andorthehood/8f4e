import { SpriteCoordinates } from '@8f4e/2d-engine';

import generateFont, { FontLookups, generateLookups as generateLookupsForFonts } from './font';
import generateFillColors, { generateLookup as generateLookupForFillColors } from './fillColors';
import generateFeedbackScale, { generateLookup as generateLookupForFeedbackScale } from './feedbackScale';
import generatePlotter, { generateLookup as generateLookupForPlotter } from './plotter';
import generateBackground, { generateLookup as generateLookupForBackground } from './background';
import generateIcons, { Icon, generateLookup as generateLookupForIcons } from './icons';
import generatePianoKeyboard, { generateLookup as generateLookupForPianoKeys } from './pianoKeyboard';
import { Command, Config } from './types';
import ascii8x16 from './fonts/8x16/ascii';
import ascii6x10 from './fonts/6x10/ascii';
import glyphs8x16 from './fonts/8x16/glyphs';
import glyphs6x10 from './fonts/6x10/glyphs';

export { Icon } from './icons';
export type { ColorScheme, Font } from './types';
export { PianoKey } from './pianoKeyboard';

const fonts: Record<
	Config['font'],
	{ asciiBitmap: number[]; glyphsBitmap: number[]; characterWidth: number; characterHeight: number }
> = {
	'8x16': {
		asciiBitmap: ascii8x16,
		glyphsBitmap: glyphs8x16,
		characterWidth: 8,
		characterHeight: 16,
	},
	'6x10': {
		asciiBitmap: ascii6x10,
		glyphsBitmap: glyphs6x10,
		characterWidth: 6,
		characterHeight: 10,
	},
};

export interface SpriteLookups extends FontLookups {
	fillColors: Record<keyof Config['colorScheme']['fill'], SpriteCoordinates>;
	plotter: Record<number, SpriteCoordinates>;
	background: Record<0, SpriteCoordinates>;
	icons: Record<Icon, SpriteCoordinates>;
	feedbackScale: Record<number, SpriteCoordinates>;
	pianoKeys: Record<number, SpriteCoordinates>;
}

export default function generateSprite(config: Config): {
	canvas: OffscreenCanvas | HTMLCanvasElement;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
} {
	let canvas: OffscreenCanvas | HTMLCanvasElement;
	const { characterWidth, characterHeight, asciiBitmap, glyphsBitmap } = fonts[config.font];

	if (window.OffscreenCanvas) {
		canvas = new OffscreenCanvas(1024, 1024);
	} else {
		canvas = document.createElement('canvas');
		canvas.width = 1024;
		canvas.height = 1024;
	}

	const ctx = canvas.getContext('2d', {
		alpha: true,
		antialias: false,
	}) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

	const commands = [
		...generatePlotter(characterWidth, characterHeight, config.colorScheme.fill),
		...generateFillColors(characterWidth, characterHeight, config.colorScheme.fill),
		...generateFeedbackScale(asciiBitmap, characterWidth, characterHeight, config.colorScheme.icons),
		...generateFont(asciiBitmap, characterWidth, characterHeight, config.colorScheme.text),
		...generateBackground(glyphsBitmap, characterWidth, characterHeight, config.colorScheme.fill),
		...generateIcons(glyphsBitmap, characterWidth, characterHeight, config.colorScheme.icons),
		...generatePianoKeyboard(glyphsBitmap, asciiBitmap, characterWidth, characterHeight, config.colorScheme.icons),
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

	return {
		canvas,
		characterHeight,
		characterWidth,
		spriteLookups: {
			fillColors: generateLookupForFillColors(characterWidth, characterHeight),
			...generateLookupsForFonts(characterWidth, characterHeight),
			feedbackScale: generateLookupForFeedbackScale(
				characterWidth,
				characterHeight,
				config.colorScheme.icons.feedbackScale
			),
			plotter: generateLookupForPlotter(characterWidth, characterHeight),
			background: generateLookupForBackground(characterWidth, characterHeight),
			icons: generateLookupForIcons(characterWidth, characterHeight),
			pianoKeys: generateLookupForPianoKeys(characterWidth, characterHeight),
		},
	};
}
