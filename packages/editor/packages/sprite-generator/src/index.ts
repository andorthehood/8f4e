import { SpriteCoordinates } from 'glugglug';

import generateFont, { FontLookups, generateLookups as generateLookupsForFonts } from './font';
import generateFillColors, { generateLookup as generateLookupForFillColors } from './fillColors';
import generateFeedbackScale, { generateLookup as generateLookupForFeedbackScale } from './feedbackScale';
import generateBackground, { generateLookup as generateLookupForBackground } from './background';
import generateIcons, { Icon, generateLookup as generateLookupForIcons } from './icons';
import { createAtlasLayout } from './atlasLayout';
import { Command, FONT_NAMES, type Config, type ColorScheme, type ColorSchemeOverrides, type Font } from './types';
import decodeFontBase64 from './fonts/font-decoder';
import defaultColorScheme from './defaultColorScheme';

import type { FontMetadata } from './fonts/ibmvga8x16/generated/ascii';
import type { FillSpriteColorName } from './fillColors';

export { Icon } from './icons';
export { FONT_NAMES } from './types';
export type { ColorScheme, ColorSchemeOverrides, Font } from './types';
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

const FONT_DEFINITIONS: Record<Font, FontDefinition> = {
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
		loadMetadata: async () => {
			const [{ fontMetadata: asciiMetadata }, { fontMetadata: glyphsMetadata }] = await Promise.all([
				import('./fonts/ibmvga8x16/generated/ascii'),
				import('./fonts/ibmvga8x16/generated/glyphs'),
			]);

			return { asciiMetadata, glyphsMetadata };
		},
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

// Fonts are loaded on first use and cached so each bitmap is decoded at most once.
const fontCache: Partial<Record<Font, FontData>> = {};

export const DEFAULT_FONT: Font = 'ibmvga8x16';

function resolveFont(font: Config['font']): Font {
	return FONT_NAMES.includes(font as Font) ? (font as Font) : DEFAULT_FONT;
}

async function loadFont(font: Font): Promise<FontData> {
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
	fillColors: Record<FillSpriteColorName, SpriteCoordinates>;
	background: Record<0, SpriteCoordinates>;
	icons: Record<Icon, SpriteCoordinates>;
	feedbackScale: Record<number, SpriteCoordinates>;
}

export function resolveColorScheme(overrides: Config['colorScheme'] = {}): ColorScheme {
	const colorSchemeOverrides = overrides as ColorSchemeOverrides;
	return {
		text: { ...defaultColorScheme.text, ...colorSchemeOverrides.text },
		fill: { ...defaultColorScheme.fill, ...colorSchemeOverrides.fill },
		icons: { ...defaultColorScheme.icons, ...colorSchemeOverrides.icons },
	};
}

export default async function generateSprite(config: Config): Promise<{
	canvas: OffscreenCanvas;
	spriteLookups: SpriteLookups;
	characterWidth: number;
	characterHeight: number;
}> {
	const { characterWidth, characterHeight, asciiBitmap, glyphsBitmap } = await loadFont(resolveFont(config.font));
	const layout = createAtlasLayout(characterWidth, characterHeight);
	const canvas = new OffscreenCanvas(layout.canvasWidth, layout.canvasHeight);
	const colorScheme = resolveColorScheme(config.colorScheme);

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
		},
	};
}
