import type { SpriteCoordinates } from 'glugglugglug';

import { ASCII_CHARACTER_COUNT, CUSTOM_GLYPH_COUNT, createAtlasLayout, FONT_COLOR_NAMES } from './atlasLayout.ts';
import Glyph from './fonts/types.ts';
import { Command, type DrawingCommand, type FontColors } from './types.ts';

const ASCII_START = 0;
const ASCII_END = ASCII_CHARACTER_COUNT - 1;
const CUSTOM_GLYPH_START = 0xe000;

/** Custom font characters use private-use Unicode codes, separate from ASCII character codes. */
export const FontGlyph = Object.fromEntries(
	Object.entries(Glyph).map(([name, code]) => [name, String.fromCharCode(CUSTOM_GLYPH_START + code)])
) as { readonly [Name in keyof typeof Glyph]: string };

/**
 * Builds a deduped font layout from the runtime text and connector color map.
 *
 * Deduplication is based on exact string equality of color values. Roles that
 * share the same color string are assigned the same row index, so only one
 * atlas row is rendered per unique color. Row ordering is deterministic:
 * unique colors are assigned row indices in the order their first corresponding
 * role appears in FONT_COLOR_NAMES.
 */
export function buildFontLayout(colors: FontColors): {
	rowsByRole: Record<keyof FontColors, number>;
	uniqueRows: Array<{ color: string; roles: Array<keyof FontColors> }>;
} {
	const colorToRow = new Map<string, number>();
	const uniqueRows: Array<{ color: string; roles: Array<keyof FontColors> }> = [];

	for (const role of FONT_COLOR_NAMES) {
		const color = colors[role];
		if (!colorToRow.has(color)) {
			colorToRow.set(color, uniqueRows.length);
			uniqueRows.push({ color, roles: [] });
		}
		uniqueRows[colorToRow.get(color)!].roles.push(role);
	}

	const rowsByRole = Object.fromEntries(FONT_COLOR_NAMES.map(role => [role, colorToRow.get(colors[role])!])) as Record<
		keyof FontColors,
		number
	>;

	return { rowsByRole, uniqueRows };
}

function forEachBit(
	byte: number,
	characterWidth: number,
	callback: (isByteSet: boolean, nthBit: number) => void
): void {
	for (let i = 0; i < characterWidth; i++) {
		const mask = 1 << (characterWidth - 1 - i);
		callback((byte & mask) !== 0, i);
	}
}

export function drawCharacter(
	font: number[],
	charCode: number | string,
	characterWidth: number,
	characterHeight: number
): DrawingCommand[] {
	const commands: DrawingCommand[] = [];
	const char = typeof charCode === 'string' ? charCode.charCodeAt(0) : charCode;
	for (let i = 0; i < characterHeight; i++) {
		forEachBit(font[char * characterHeight + i], characterWidth, (bit, nthBit) => {
			if (bit) {
				commands.push([Command.PIXEL, nthBit, i]);
			}
		});
	}
	return commands;
}

export function drawCharacterMatrix(
	font: number[],
	characterWidth: number,
	characterHeight: number,
	characterMatrix: number[][]
): DrawingCommand[] {
	const commands: DrawingCommand[] = [[Command.SAVE]];
	characterMatrix.forEach(characterArray => {
		characterArray.forEach(char => {
			commands.push(...drawCharacter(font, char, characterWidth, characterHeight), [
				Command.TRANSLATE,
				characterWidth,
				0,
			]);
		});
		commands.push([Command.TRANSLATE, characterArray.length * -characterWidth, characterHeight]);
	});
	commands.push([Command.RESTORE]);
	return commands;
}

function generateFont(
	x: number,
	y: number,
	font: number[],
	glyphsFont: number[],
	characterWidth: number,
	characterHeight: number
): DrawingCommand[] {
	const commands: DrawingCommand[] = [[Command.TRANSLATE, x, y]];

	for (let code = ASCII_START; code <= ASCII_END; code++) {
		commands.push(...drawCharacter(font, code, characterWidth, characterHeight), [
			Command.TRANSLATE,
			characterWidth,
			0,
		]);
	}
	for (let code = 0; code < CUSTOM_GLYPH_COUNT; code++) {
		commands.push(...drawCharacter(glyphsFont, code, characterWidth, characterHeight), [
			Command.TRANSLATE,
			characterWidth,
			0,
		]);
	}

	commands.push([Command.RESET_TRANSFORM]);
	return commands;
}

export default function generateFonts(
	font: number[],
	glyphsFont: number[],
	characterWidth: number,
	characterHeight: number,
	colors: FontColors
): DrawingCommand[] {
	const layout = createAtlasLayout(characterWidth, characterHeight);
	const { uniqueRows } = buildFontLayout(colors);

	return [
		[Command.RESET_TRANSFORM],
		...uniqueRows.flatMap<DrawingCommand>(({ color }, i) => {
			return [
				[Command.FILL_COLOR, color],
				...generateFont(
					layout.font.x,
					layout.font.y + characterHeight * i,
					font,
					glyphsFont,
					characterWidth,
					characterHeight
				),
			];
		}),
	];
}

function capitalize(word: string) {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

export type FontLookups = {
	[key in keyof FontColors as `font${Capitalize<string & key>}`]: Partial<Record<number | string, SpriteCoordinates>>;
};

export const generateLookups = (characterWidth: number, characterHeight: number, colors: FontColors) => {
	const layout = createAtlasLayout(characterWidth, characterHeight);
	const { rowsByRole } = buildFontLayout(colors);

	return Object.fromEntries(
		FONT_COLOR_NAMES.map(colorName => {
			const lookups: Record<number | string, SpriteCoordinates> = {};
			const y = layout.font.y + characterHeight * rowsByRole[colorName];

			for (let code = ASCII_START; code <= ASCII_END; code++) {
				const coordinates = {
					x: code * characterWidth + layout.font.x,
					y,
					spriteHeight: characterHeight,
					spriteWidth: characterWidth,
				};
				lookups[code] = coordinates;
				lookups[String.fromCharCode(code)] = coordinates;
			}
			for (let code = 0; code < CUSTOM_GLYPH_COUNT; code++) {
				const coordinates = {
					x: (ASCII_CHARACTER_COUNT + code) * characterWidth + layout.font.x,
					y,
					spriteHeight: characterHeight,
					spriteWidth: characterWidth,
				};
				const characterCode = CUSTOM_GLYPH_START + code;
				lookups[characterCode] = coordinates;
				lookups[String.fromCharCode(characterCode)] = coordinates;
			}

			return [`font` + capitalize(colorName), lookups];
		})
	) as FontLookups;
};
