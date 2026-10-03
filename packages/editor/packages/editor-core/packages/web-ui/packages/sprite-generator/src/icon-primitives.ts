import type { SpriteCoordinates } from 'glugglugglug';
import { createAtlasLayout, FEEDBACK_GLYPH_COUNT, ICON_BACKGROUND_NAMES, ICON_GLYPH_NAMES } from './atlasLayout.ts';
import { drawCharacter } from './font.ts';
import Glyph from './fonts/types.ts';
import { type ColorScheme, Command, type DrawingCommand } from './types.ts';

type IconBackgroundName = (typeof ICON_BACKGROUND_NAMES)[number];
type IconGlyphName = (typeof ICON_GLYPH_NAMES)[number];

export interface IconPrimitiveLookups {
	iconFillColors: Record<IconBackgroundName, SpriteCoordinates>;
	iconGlyphs: Record<IconGlyphName, SpriteCoordinates>;
	feedbackGlyphs: Partial<Record<number, SpriteCoordinates>>;
}

const glyphs: Record<
	IconGlyphName,
	{ font: 'ascii' | 'glyphs'; char: string | number; color: 'inputConnector' | 'outputConnector' }
> = {
	inputLeftBracket: { font: 'ascii', char: '[', color: 'inputConnector' },
	inputRightBracket: { font: 'ascii', char: ']', color: 'inputConnector' },
	switchKnob: { font: 'glyphs', char: Glyph.SWITCH_KNOB, color: 'inputConnector' },
	outputLeftBracket: { font: 'ascii', char: '[', color: 'outputConnector' },
	outputRightBracket: { font: 'ascii', char: ']', color: 'outputConnector' },
};

/** Empty theme entries omit their star; remaining scale entries retain their original order. */
export function getFeedbackGlyphColors(colors: ColorScheme['icons']): string[] {
	return Array.from(
		{ length: FEEDBACK_GLYPH_COUNT },
		(_, index) => colors[`feedbackScale${index}` as keyof ColorScheme['icons']]
	).filter(color => color.trim().length > 0);
}

/** Generates only single-cell fills and glyphs; consumers assemble complete icons. */
export default function generateIconPrimitives(
	asciiFont: number[],
	glyphsFont: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	const { iconPrimitives } = createAtlasLayout(characterWidth, characterHeight);
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, iconPrimitives.x, iconPrimitives.y],
		...ICON_BACKGROUND_NAMES.flatMap<DrawingCommand>(name => [
			[Command.FILL_COLOR, colors[name]],
			[Command.RECTANGLE, 0, 0, characterWidth, characterHeight],
			[Command.TRANSLATE, characterWidth, 0],
		]),
		...ICON_GLYPH_NAMES.flatMap<DrawingCommand>(name => {
			const glyph = glyphs[name];
			return [
				[Command.FILL_COLOR, colors[glyph.color]],
				...drawCharacter(glyph.font === 'ascii' ? asciiFont : glyphsFont, glyph.char, characterWidth, characterHeight),
				[Command.TRANSLATE, characterWidth, 0],
			];
		}),
		...getFeedbackGlyphColors(colors).flatMap<DrawingCommand>(color => [
			[Command.FILL_COLOR, color],
			...drawCharacter(asciiFont, '*', characterWidth, characterHeight),
			[Command.TRANSLATE, characterWidth, 0],
		]),
	];
}

export function generateLookup(
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): IconPrimitiveLookups {
	const { iconPrimitives } = createAtlasLayout(characterWidth, characterHeight);
	const coordinates = (column: number): SpriteCoordinates => ({
		x: iconPrimitives.x + column * characterWidth,
		y: iconPrimitives.y,
		spriteWidth: characterWidth,
		spriteHeight: characterHeight,
	});
	return {
		iconFillColors: Object.fromEntries(
			ICON_BACKGROUND_NAMES.map((name, index) => [name, coordinates(index)])
		) as IconPrimitiveLookups['iconFillColors'],
		iconGlyphs: Object.fromEntries(
			ICON_GLYPH_NAMES.map((name, index) => [name, coordinates(ICON_BACKGROUND_NAMES.length + index)])
		) as IconPrimitiveLookups['iconGlyphs'],
		feedbackGlyphs: Object.fromEntries(
			getFeedbackGlyphColors(colors).map((_, index) => [
				index,
				coordinates(ICON_BACKGROUND_NAMES.length + ICON_GLYPH_NAMES.length + index),
			])
		),
	};
}
