import { SpriteCoordinates } from 'glugglug';

import generateFont, { FontLookups, generateLookups as generateLookupsForFonts } from './font';
import generateFillColors, { generateLookup as generateLookupForFillColors } from './fillColors';
import generateFeedbackScale, { generateLookup as generateLookupForFeedbackScale } from './feedbackScale';
import generatePlotter, { generateLookup as generateLookupForPlotter } from './plotter';
import generateBackground, { generateLookup as generateLookupForBackground } from './background';
import generateIcons, { Icon, generateLookup as generateLookupForIcons } from './icons';
import generatePianoKeyboard, { generateLookup as generateLookupForPianoKeys } from './pianoKeyboard';
import { Command, Config, ColorScheme } from './types';
import decodeFontBase64 from './fonts/font-decoder';
import { fontMetadata as ascii8x16Metadata } from './fonts/8x16/generated/ascii';
import { fontMetadata as ascii6x10Metadata } from './fonts/6x10/generated/ascii';
import { fontMetadata as glyphs8x16Metadata } from './fonts/8x16/generated/glyphs';
import { fontMetadata as glyphs6x10Metadata } from './fonts/6x10/generated/glyphs';
import defaultColorScheme from './defaultColorScheme';

export { Icon } from './icons';
export type { ColorScheme, Font } from './types';
export { PianoKey } from './pianoKeyboard';
export { default as defaultColorScheme } from './defaultColorScheme';

const fonts: Record<
	Config['font'],
	{ asciiBitmap: number[]; glyphsBitmap: number[]; characterWidth: number; characterHeight: number }
> = {
	'8x16': {
		asciiBitmap: decodeFontBase64(ascii8x16Metadata),
		glyphsBitmap: decodeFontBase64(glyphs8x16Metadata),
		characterWidth: 8,
		characterHeight: 16,
	},
	'6x10': {
		asciiBitmap: decodeFontBase64(ascii6x10Metadata),
		glyphsBitmap: decodeFontBase64(glyphs6x10Metadata),
		characterWidth: 6,
		characterHeight: 10,
	},
};

export interface SpriteLookups extends FontLookups {
	fillColors: Record<keyof ColorScheme['fill'], SpriteCoordinates>;
	plotter: Record<number, SpriteCoordinates>;
	background: Record<0, SpriteCoordinates>;
	icons: Record<Icon, SpriteCoordinates>;
	feedbackScale: Record<number, SpriteCoordinates>;
	pianoKeys: Record<number, SpriteCoordinates>;
}

export default function generateSprite(config: Config): {
	canvas: OffscreenCanvas;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
} {
	const canvas = new OffscreenCanvas(1024, 1024);
	const { characterWidth, characterHeight, asciiBitmap, glyphsBitmap } = fonts[config.font];

	// Use default color scheme if none provided
	const colorScheme = config.colorScheme || defaultColorScheme;

	const ctx = canvas.getContext('2d', {
		alpha: true,
		antialias: false,
	}) as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

	const commands = [
		...generatePlotter(characterWidth, characterHeight, colorScheme.fill),
		...generateFillColors(characterWidth, characterHeight, colorScheme.fill),
		...generateFeedbackScale(asciiBitmap, characterWidth, characterHeight, colorScheme.icons),
		...generateFont(asciiBitmap, characterWidth, characterHeight, colorScheme.text),
		...generateBackground(glyphsBitmap, characterWidth, characterHeight, colorScheme.fill),
		...generateIcons(glyphsBitmap, characterWidth, characterHeight, colorScheme.icons),
		...generatePianoKeyboard(glyphsBitmap, asciiBitmap, characterWidth, characterHeight, colorScheme.icons),
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
			feedbackScale: generateLookupForFeedbackScale(characterWidth, characterHeight, colorScheme.icons.feedbackScale),
			plotter: generateLookupForPlotter(characterWidth, characterHeight),
			background: generateLookupForBackground(characterWidth, characterHeight),
			icons: generateLookupForIcons(characterWidth, characterHeight),
			pianoKeys: generateLookupForPianoKeys(characterWidth, characterHeight),
		},
	};
}
