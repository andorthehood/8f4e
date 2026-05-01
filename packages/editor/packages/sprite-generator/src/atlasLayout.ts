import defaultColorScheme from './defaultColorScheme';

import type { SpriteCoordinates } from 'glugglug';
import type { ColorScheme } from './types';

export const TEXT_COLOR_NAMES = Object.keys(defaultColorScheme.text) as Array<keyof ColorScheme['text']>;
export const FILL_COLOR_NAMES = Object.keys(defaultColorScheme.fill) as Array<keyof ColorScheme['fill']>;

const FONT_COLUMNS = 128;
const BACKGROUND_COLUMNS = 64;
const BACKGROUND_ROWS = 32;
const FEEDBACK_SCALE_SLOT_COUNT = 6;
const FEEDBACK_SCALE_ITEM_COLUMNS = 3;
const ICON_CHARACTER_WIDTHS = [3, 4, 4] as const;

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
	const backgroundYRows = fontRows;
	const sidebarXColumns = BACKGROUND_COLUMNS;
	const feedbackScaleYRows = backgroundYRows;
	const fillColorsYRows = feedbackScaleYRows + 1;
	const iconsYRows = fillColorsYRows + 1;

	const feedbackScaleWidthColumns = FEEDBACK_SCALE_SLOT_COUNT * FEEDBACK_SCALE_ITEM_COLUMNS;
	const fillColorsWidthColumns = FILL_COLOR_NAMES.length;
	const iconsWidthColumns = ICON_CHARACTER_WIDTHS.reduce((sum, width) => sum + width, 0);
	const sidebarWidthColumns = Math.max(feedbackScaleWidthColumns, fillColorsWidthColumns, iconsWidthColumns);

	const font = createSection(0, 0, FONT_COLUMNS, fontRows, characterWidth, characterHeight);
	const background = createSection(
		0,
		backgroundYRows,
		BACKGROUND_COLUMNS,
		BACKGROUND_ROWS,
		characterWidth,
		characterHeight
	);
	const feedbackScale = createSection(
		sidebarXColumns,
		feedbackScaleYRows,
		feedbackScaleWidthColumns,
		1,
		characterWidth,
		characterHeight
	);
	const fillColors = createSection(
		sidebarXColumns,
		fillColorsYRows,
		fillColorsWidthColumns,
		1,
		characterWidth,
		characterHeight
	);
	const icons = createSection(sidebarXColumns, iconsYRows, iconsWidthColumns, 1, characterWidth, characterHeight);

	return {
		canvasWidth: Math.max(
			font.right,
			background.right,
			columnsToPixels(sidebarXColumns + sidebarWidthColumns, characterWidth)
		),
		canvasHeight: Math.max(background.bottom, icons.bottom),
		font,
		background,
		feedbackScale,
		fillColors,
		icons,
	};
}

export function createSpriteCoordinates(
	x: number,
	y: number,
	spriteWidth: number,
	spriteHeight: number
): SpriteCoordinates {
	return { x, y, spriteWidth, spriteHeight };
}
