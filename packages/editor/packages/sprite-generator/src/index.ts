import { SpriteCoordinates } from 'glugglug';

import generateFont, { FontLookups, generateLookups as generateLookupsForFonts } from './font';
import generateFillColors, { generateLookup as generateLookupForFillColors } from './fillColors';
import generateFeedbackScale, { generateLookup as generateLookupForFeedbackScale } from './feedbackScale';
import generateBackground, { generateLookup as generateLookupForBackground } from './background';
import generateIcons, { Icon, generateLookup as generateLookupForIcons } from './icons';
import generatePianoKeyboard, { generateLookup as generateLookupForPianoKeys } from './pianoKeyboard';
import { createAtlasLayout } from './atlasLayout';
import { Command, Config, ColorScheme } from './types';
import decodeFontBase64 from './fonts/font-decoder';
import { fontMetadata as ascii8x16Metadata } from './fonts/ibmvga8x16/generated/ascii';
import { fontMetadata as glyphs8x16Metadata } from './fonts/ibmvga8x16/generated/glyphs';
import defaultColorScheme from './defaultColorScheme';

import type { FontMetadata } from './fonts/ibmvga8x16/generated/ascii';

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

type FontMetadataSet = {
	asciiMetadata: FontMetadata;
	glyphsMetadata: FontMetadata;
};

type FontDefinition = {
	characterWidth: number;
	characterHeight: number;
	loadMetadata: () => Promise<FontMetadataSet>;
};

const FONT_DEFINITIONS: Record<Config['font'], FontDefinition> = {
	attpc63008x16: {
		characterWidth: 8,
		characterHeight: 16,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/attpc63008x16/generated/ascii'),
				import('./fonts/attpc63008x16/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	'6x10': {
		characterWidth: 6,
		characterHeight: 10,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/6x10/generated/ascii'),
				import('./fonts/6x10/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	ibmvga8x16: {
		characterWidth: 8,
		characterHeight: 16,
		loadMetadata: async () => ({
			asciiMetadata: ascii8x16Metadata,
			glyphsMetadata: glyphs8x16Metadata,
		}),
	},
	nix8810m168x16: {
		characterWidth: 8,
		characterHeight: 16,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/nix8810m168x16/generated/ascii'),
				import('./fonts/nix8810m168x16/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	olivettithin8x16: {
		characterWidth: 8,
		characterHeight: 16,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/olivettithin8x16/generated/ascii'),
				import('./fonts/olivettithin8x16/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	spleen5x8: {
		characterWidth: 5,
		characterHeight: 8,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/spleen5x8/generated/ascii'),
				import('./fonts/spleen5x8/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	spleen6x12: {
		characterWidth: 6,
		characterHeight: 12,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/spleen6x12/generated/ascii'),
				import('./fonts/spleen6x12/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	spleen8x16: {
		characterWidth: 8,
		characterHeight: 16,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/spleen8x16/generated/ascii'),
				import('./fonts/spleen8x16/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	templeos8x8: {
		characterWidth: 8,
		characterHeight: 8,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/templeos8x8/generated/ascii'),
				import('./fonts/templeos8x8/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	spleen12x24: {
		characterWidth: 12,
		characterHeight: 24,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/spleen12x24/generated/ascii'),
				import('./fonts/spleen12x24/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	spleen16x32: {
		characterWidth: 16,
		characterHeight: 32,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/spleen16x32/generated/ascii'),
				import('./fonts/spleen16x32/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	terminus8x16: {
		characterWidth: 8,
		characterHeight: 16,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/terminus8x16/generated/ascii'),
				import('./fonts/terminus8x16/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	terminus8x16bold: {
		characterWidth: 8,
		characterHeight: 16,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/terminus8x16bold/generated/ascii'),
				import('./fonts/terminus8x16bold/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	terminus10x18: {
		characterWidth: 10,
		characterHeight: 18,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/terminus10x18/generated/ascii'),
				import('./fonts/terminus10x18/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	terminus10x18bold: {
		characterWidth: 10,
		characterHeight: 18,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/terminus10x18bold/generated/ascii'),
				import('./fonts/terminus10x18bold/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	kana12x13: {
		characterWidth: 12,
		characterHeight: 13,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/kana12x13/generated/ascii'),
				import('./fonts/kana12x13/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	terminus12x24: {
		characterWidth: 12,
		characterHeight: 24,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/terminus12x24/generated/ascii'),
				import('./fonts/terminus12x24/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
	terminus12x24bold: {
		characterWidth: 12,
		characterHeight: 24,
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/terminus12x24bold/generated/ascii'),
				import('./fonts/terminus12x24bold/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
	},
};

function decodeFontData({ asciiMetadata, glyphsMetadata }: FontMetadataSet, definition: FontDefinition): FontData {
	return {
		asciiBitmap: decodeFontBase64(asciiMetadata),
		glyphsBitmap: decodeFontBase64(glyphsMetadata),
		characterWidth: definition.characterWidth,
		characterHeight: definition.characterHeight,
	};
}

// ibmvga8x16 is the default font: eagerly decoded at module initialization for a fast startup path.
const fontCache: Partial<Record<Config['font'], FontData>> = {
	ibmvga8x16: decodeFontData(
		{
			asciiMetadata: ascii8x16Metadata,
			glyphsMetadata: glyphs8x16Metadata,
		},
		FONT_DEFINITIONS.ibmvga8x16
	),
};

// Lazily load and decode an alternate font, caching the result so it is decoded at most once.
async function loadFont(font: Config['font']): Promise<FontData> {
	if (fontCache[font]) {
		return fontCache[font]!;
	}

	const definition = FONT_DEFINITIONS[font];
	const metadata = await definition.loadMetadata();
	const fontData = decodeFontData(metadata, definition);

	fontCache[font] = fontData;
	return fontData;
}

export interface SpriteLookups extends FontLookups {
	fillColors: Record<keyof ColorScheme['fill'], SpriteCoordinates>;
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
		...generateFillColors(characterWidth, characterHeight, colorScheme.fill),
		...generateFeedbackScale(asciiBitmap, characterWidth, characterHeight, colorScheme.icons),
		...generateFont(asciiBitmap, characterWidth, characterHeight, colorScheme.text),
		...generateBackground(glyphsBitmap, characterWidth, characterHeight, colorScheme.fill),
		...generateIcons(asciiBitmap, glyphsBitmap, characterWidth, characterHeight, colorScheme.icons),
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
			background: generateLookupForBackground(characterWidth, characterHeight),
			icons: generateLookupForIcons(characterWidth, characterHeight),
			pianoKeys: generateLookupForPianoKeys(characterWidth, characterHeight),
		},
	};
}
