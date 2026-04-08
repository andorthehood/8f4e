import { SpriteCoordinates } from 'glugglug';

import generateFont, { FontLookups, generateLookups as generateLookupsForFonts } from './font';
import generateFillColors, { generateLookup as generateLookupForFillColors } from './fillColors';
import generateFeedbackScale, { generateLookup as generateLookupForFeedbackScale } from './feedbackScale';
import generatePlotter, { generateLookup as generateLookupForPlotter } from './plotter';
import generateBackground, { generateLookup as generateLookupForBackground } from './background';
import generateIcons, { Icon, generateLookup as generateLookupForIcons } from './icons';
import generatePianoKeyboard, { generateLookup as generateLookupForPianoKeys } from './pianoKeyboard';
import { createAtlasLayout } from './atlasLayout';
import { Command, Config, ColorScheme } from './types';
import decodeFontBase64 from './fonts/font-decoder';
import { fontMetadata as ascii8x16Metadata } from './fonts/ibmvga8x16/generated/ascii';
import { fontMetadata as glyphs8x16Metadata } from './fonts/ibmvga8x16/generated/glyphs';
import defaultColorScheme from './defaultColorScheme';

export { Icon } from './icons';
export { FONT_NAMES } from './types';
export type { ColorScheme, Font } from './types';
export { PianoKey } from './pianoKeyboard';
export { default as defaultColorScheme } from './defaultColorScheme';

type FontData = {
	asciiBitmap: number[];
	glyphsBitmap: number[];
	characterWidth: number;
	characterHeight: number;
};

// ibmvga8x16 is the default font: eagerly decoded at module initialization for a fast startup path.
const fontCache: Partial<Record<Config['font'], FontData>> = {
	ibmvga8x16: {
		asciiBitmap: decodeFontBase64(ascii8x16Metadata),
		glyphsBitmap: decodeFontBase64(glyphs8x16Metadata),
		characterWidth: 8,
		characterHeight: 16,
	},
};

// Lazily load and decode an alternate font, caching the result so it is decoded at most once.
async function loadFont(font: Config['font']): Promise<FontData> {
	if (fontCache[font]) {
		return fontCache[font]!;
	}
	if (font === '6x10') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/6x10/generated/ascii'),
			import('./fonts/6x10/generated/glyphs'),
		]);
		fontCache['6x10'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 6,
			characterHeight: 10,
		};
		return fontCache['6x10'];
	}
	if (font === 'spleen5x8') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/spleen5x8/generated/ascii'),
			import('./fonts/spleen5x8/generated/glyphs'),
		]);
		fontCache['spleen5x8'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 5,
			characterHeight: 8,
		};
		return fontCache['spleen5x8'];
	}
	if (font === 'spleen6x12') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/spleen6x12/generated/ascii'),
			import('./fonts/spleen6x12/generated/glyphs'),
		]);
		fontCache['spleen6x12'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 6,
			characterHeight: 12,
		};
		return fontCache['spleen6x12'];
	}
	if (font === 'terminus8x16') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/terminus8x16/generated/ascii'),
			import('./fonts/terminus8x16/generated/glyphs'),
		]);
		fontCache['terminus8x16'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 8,
			characterHeight: 16,
		};
		return fontCache['terminus8x16'];
	}
	if (font === 'spleen8x16') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/spleen8x16/generated/ascii'),
			import('./fonts/spleen8x16/generated/glyphs'),
		]);
		fontCache['spleen8x16'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 8,
			characterHeight: 16,
		};
		return fontCache['spleen8x16'];
	}
	if (font === 'terminus8x16bold') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/terminus8x16bold/generated/ascii'),
			import('./fonts/terminus8x16bold/generated/glyphs'),
		]);
		fontCache['terminus8x16bold'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 8,
			characterHeight: 16,
		};
		return fontCache['terminus8x16bold'];
	}
	if (font === 'terminus10x18') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/terminus10x18/generated/ascii'),
			import('./fonts/terminus10x18/generated/glyphs'),
		]);
		fontCache['terminus10x18'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 10,
			characterHeight: 18,
		};
		return fontCache['terminus10x18'];
	}
	if (font === 'terminus10x18bold') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/terminus10x18bold/generated/ascii'),
			import('./fonts/terminus10x18bold/generated/glyphs'),
		]);
		fontCache['terminus10x18bold'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 10,
			characterHeight: 18,
		};
		return fontCache['terminus10x18bold'];
	}
	if (font === 'kana12x13') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/kana12x13/generated/ascii'),
			import('./fonts/kana12x13/generated/glyphs'),
		]);
		fontCache['kana12x13'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 12,
			characterHeight: 13,
		};
		return fontCache['kana12x13'];
	}
	if (font === 'spleen12x24') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/spleen12x24/generated/ascii'),
			import('./fonts/spleen12x24/generated/glyphs'),
		]);
		fontCache['spleen12x24'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 12,
			characterHeight: 24,
		};
		return fontCache['spleen12x24'];
	}
	if (font === 'terminus12x24') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/terminus12x24/generated/ascii'),
			import('./fonts/terminus12x24/generated/glyphs'),
		]);
		fontCache['terminus12x24'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 12,
			characterHeight: 24,
		};
		return fontCache['terminus12x24'];
	}
	if (font === 'terminus12x24bold') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/terminus12x24bold/generated/ascii'),
			import('./fonts/terminus12x24bold/generated/glyphs'),
		]);
		fontCache['terminus12x24bold'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 12,
			characterHeight: 24,
		};
		return fontCache['terminus12x24bold'];
	}
	if (font === 'spleen16x32') {
		const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
			import('./fonts/spleen16x32/generated/ascii'),
			import('./fonts/spleen16x32/generated/glyphs'),
		]);
		fontCache['spleen16x32'] = {
			asciiBitmap: decodeFontBase64(asciiMetadata),
			glyphsBitmap: decodeFontBase64(glyphsMetadata),
			characterWidth: 16,
			characterHeight: 32,
		};
		return fontCache['spleen16x32'];
	}

	throw new Error(`Unsupported font '${font}'`);
}

export interface SpriteLookups extends FontLookups {
	fillColors: Record<keyof ColorScheme['fill'], SpriteCoordinates>;
	plotter: Record<number, SpriteCoordinates>;
	background: Record<0, SpriteCoordinates>;
	icons: Record<Icon, SpriteCoordinates>;
	feedbackScale: Record<number, SpriteCoordinates>;
	pianoKeys: Record<number, SpriteCoordinates>;
}

export default async function generateSprite(config: Config): Promise<{
	canvas: OffscreenCanvas;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
}> {
	const { characterWidth, characterHeight, asciiBitmap, glyphsBitmap } = await loadFont(config.font);
	const layout = createAtlasLayout(characterWidth, characterHeight);
	const canvas = new OffscreenCanvas(layout.canvasWidth, layout.canvasHeight);

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
			...generateLookupsForFonts(characterWidth, characterHeight, colorScheme.text),
			feedbackScale: generateLookupForFeedbackScale(characterWidth, characterHeight, colorScheme.icons),
			plotter: generateLookupForPlotter(characterWidth, characterHeight),
			background: generateLookupForBackground(characterWidth, characterHeight),
			icons: generateLookupForIcons(characterWidth, characterHeight),
			pianoKeys: generateLookupForPianoKeys(characterWidth, characterHeight),
		},
	};
}
