import { SpriteCoordinates } from '@8f4e/2d-engine';

import generateFont, { FontLookups, generateLookups as generateLookupsForFonts } from './font';
import generateFillColors, { generateLookup as generateLookupForFillColors } from './fillColors';
import generateFeedbackScale, { generateLookup as generateLookupForFeedbackScale } from './feedbackScale';
import generateScope, { generateLookup as generateLookupForScope } from './scope';
import generateBackground, { generateLookup as generateLookupForBackground } from './background';
import generateIcons, { Icon, generateLookup as generateLookupForIcons } from './icons';
import { Command, Config } from './types';
import ascii8x16 from './fonts/8x16/ascii';
import ascii6x10 from './fonts/6x10/ascii';

export { Glyph } from './fonts/types';
export { Icon } from './icons';
export { ColorScheme } from './types';

const fonts: Record<Config['font'], { bitmap: number[]; characterWidth: number; characterHeight: number }> = {
	'8x16': {
		bitmap: ascii8x16,
		characterWidth: 8,
		characterHeight: 16,
	},
	'6x10': {
		bitmap: ascii6x10,
		characterWidth: 6,
		characterHeight: 10,
	},
};

export interface SpriteLookups extends FontLookups {
	fillColors: Record<keyof Config['colorScheme']['fill'], SpriteCoordinates>;
	scope: Record<number, SpriteCoordinates>;
	background: Record<0, SpriteCoordinates>;
	icons: Record<Icon, SpriteCoordinates>;
	feedbackScale: Record<number, SpriteCoordinates>;
}

export default function generateSprite(config: Config): {
	canvas: OffscreenCanvas | HTMLCanvasElement;
	spriteLookups: SpriteLookups;
} {
	let canvas: OffscreenCanvas | HTMLCanvasElement;
	const { characterWidth, characterHeight, bitmap: fontBitmap } = fonts[config.font];

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
		...generateFeedbackScale(fontBitmap, characterWidth, characterHeight, config.colorScheme.icons),
		...generateFont(fontBitmap, characterWidth, characterHeight, config.colorScheme.text),
		...generateBackground(config.colorScheme.fill),
		...generateIcons(fontBitmap, characterWidth, characterHeight, config.colorScheme.icons),
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
		spriteLookups: {
			fillColors: generateLookupForFillColors(characterWidth, characterHeight),
			...generateLookupsForFonts(characterWidth, characterHeight),
			feedbackScale: generateLookupForFeedbackScale(
				characterWidth,
				characterHeight,
				config.colorScheme.icons.feedbackScale
			),
			scope: generateLookupForScope(),
			background: generateLookupForBackground(characterWidth, characterHeight),
			icons: generateLookupForIcons(characterWidth, characterHeight),
		},
	};
}
