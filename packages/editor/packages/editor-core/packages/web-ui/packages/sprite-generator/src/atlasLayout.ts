import defaultColorScheme from './defaultColorScheme.ts';

import type { ColorScheme } from './types.ts';

export const TEXT_COLOR_NAMES = Object.keys(defaultColorScheme.text) as Array<keyof ColorScheme['text']>;
export const FILL_COLOR_NAMES = Object.keys(defaultColorScheme.fill) as Array<keyof ColorScheme['fill']>;

const FONT_COLUMNS = 128;
export const ICON_BACKGROUND_NAMES = [
	'inputConnectorBackground',
	'outputConnectorBackground',
	'switchBackground',
] as const;
export const ICON_GLYPH_NAMES = [
	'inputLeftBracket',
	'inputRightBracket',
	'switchKnob',
	'outputLeftBracket',
	'outputRightBracket',
] as const;
export const FEEDBACK_GLYPH_COUNT = 6;

function columnsToPixels(columns: number, characterWidth: number): number {
	return columns * characterWidth;
}

function rowsToPixels(rows: number, characterHeight: number): number {
	return rows * characterHeight;
}

function createSection(
	xColumns: number,
	yRows: number,
	widthColumns: number,
	heightRows: number,
	characterWidth: number,
	characterHeight: number
) {
	const x = columnsToPixels(xColumns, characterWidth);
	const y = rowsToPixels(yRows, characterHeight);
	const width = columnsToPixels(widthColumns, characterWidth);
	const height = rowsToPixels(heightRows, characterHeight);

	return {
		xColumns,
		yRows,
		widthColumns,
		heightRows,
		x,
		y,
		width,
		height,
		right: x + width,
		bottom: y + height,
	};
}

export function createAtlasLayout(characterWidth: number, characterHeight: number) {
	const fontRows = TEXT_COLOR_NAMES.length;
	const fillColorsYRows = fontRows;
	const iconPrimitivesYRows = fillColorsYRows + 1;
	const fillColorsWidthColumns = FILL_COLOR_NAMES.length;
	const iconPrimitivesWidthColumns = ICON_BACKGROUND_NAMES.length + ICON_GLYPH_NAMES.length + FEEDBACK_GLYPH_COUNT;
	const font = createSection(0, 0, FONT_COLUMNS, fontRows, characterWidth, characterHeight);
	const fillColors = createSection(0, fillColorsYRows, fillColorsWidthColumns, 1, characterWidth, characterHeight);
	const iconPrimitives = createSection(
		0,
		iconPrimitivesYRows,
		iconPrimitivesWidthColumns,
		1,
		characterWidth,
		characterHeight
	);
	return {
		canvasWidth: Math.max(font.right, fillColors.right, iconPrimitives.right),
		canvasHeight: iconPrimitives.bottom,
		font,
		fillColors,
		iconPrimitives,
	};
}
