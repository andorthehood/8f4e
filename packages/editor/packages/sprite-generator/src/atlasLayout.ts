import type { SpriteCoordinates } from 'glugglug';

export const TEXT_COLOR_NAMES = [
	'lineNumber',
	'debugInfo',
	'arrow',
	'instruction',
	'codeComment',
	'code',
	'errorMessage',
	'disabledCode',
	'numbers',
	'menuItemText',
	'menuItemTextHighlighted',
	'dialogText',
	'dialogTitle',
	'binaryZero',
	'binaryOne',
	'basePrefix',
] as const;

export const FILL_COLOR_NAMES = [
	'menuItemBackground',
	'menuItemBackgroundHighlighted',
	'background',
	'backgroundDots',
	'debugInfoBackground',
	'moduleBackground',
	'moduleBackgroundDragged',
	'moduleBackgroundDisabled',
	'wire',
	'wireHighlighted',
	'errorMessageBackground',
	'dialogBackground',
	'dialogDimmer',
	'highlightedCodeLine',
	'trace',
	'plotterBackground',
	'bars',
	'waveform',
	'meterGreen',
	'meterYellow',
	'meterRed',
	'scanLine',
	'track',
	'fill',
	'handle',
	'codeBlockHighlightLevel1',
	'codeBlockHighlightLevel2',
	'codeBlockHighlightLevel3',
	'recordingMatte',
] as const;

const FONT_COLUMNS = 128;
const BACKGROUND_COLUMNS = 64;
const BACKGROUND_ROWS = 32;
const PIANO_ROWS = 5;
const FEEDBACK_SCALE_SLOT_COUNT = 6;
const FEEDBACK_SCALE_ITEM_COLUMNS = 3;
const ICON_CHARACTER_WIDTHS = [3, 4, 4] as const;
const PIANO_GROUP_COUNT = 12;
const PIANO_STATE_COUNT = 3;

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
	const pianoYRows = fontRows;
	const backgroundYRows = pianoYRows + PIANO_ROWS;
	const sidebarXColumns = BACKGROUND_COLUMNS;
	const feedbackScaleYRows = backgroundYRows;
	const fillColorsYRows = feedbackScaleYRows + 1;
	const iconsYRows = fillColorsYRows + 1;

	const pianoWidthColumns = Math.ceil((characterHeight * PIANO_GROUP_COUNT * PIANO_STATE_COUNT) / characterWidth);
	const feedbackScaleWidthColumns = FEEDBACK_SCALE_SLOT_COUNT * FEEDBACK_SCALE_ITEM_COLUMNS;
	const fillColorsWidthColumns = FILL_COLOR_NAMES.length;
	const iconsWidthColumns = ICON_CHARACTER_WIDTHS.reduce((sum, width) => sum + width, 0);
	const sidebarWidthColumns = Math.max(feedbackScaleWidthColumns, fillColorsWidthColumns, iconsWidthColumns);

	const font = createSection(0, 0, FONT_COLUMNS, fontRows, characterWidth, characterHeight);
	const pianoKeyboard = createSection(0, pianoYRows, pianoWidthColumns, PIANO_ROWS, characterWidth, characterHeight);
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
			pianoKeyboard.right,
			background.right,
			columnsToPixels(sidebarXColumns + sidebarWidthColumns, characterWidth)
		),
		canvasHeight: Math.max(background.bottom, icons.bottom),
		font,
		pianoKeyboard,
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
