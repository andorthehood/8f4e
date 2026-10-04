import type { SpriteCoordinates } from 'glugglugglug';
import { createAtlasLayout, FEEDBACK_GLYPH_COUNT, ICON_BACKGROUND_NAMES } from './atlasLayout.ts';
import { drawCharacter } from './font.ts';
import { type ColorScheme, Command, type DrawingCommand } from './types.ts';

type IconBackgroundName = (typeof ICON_BACKGROUND_NAMES)[number];

export interface IconPrimitiveLookups {
	iconFillColors: Record<IconBackgroundName, SpriteCoordinates>;
	feedbackGlyphs: Partial<Record<number, SpriteCoordinates>>;
}

/** Empty theme entries omit their star; remaining scale entries retain their original order. */
export function getFeedbackGlyphColors(colors: ColorScheme['icons']): string[] {
	return Array.from(
		{ length: FEEDBACK_GLYPH_COUNT },
		(_, index) => colors[`feedbackScale${index}` as keyof ColorScheme['icons']]
	).filter(color => color.trim().length > 0);
}

/** Supplies icon backgrounds and feedback stars; brackets and knobs come from complete font rows. */
export default function generateIconPrimitives(
	asciiFont: number[],
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
		feedbackGlyphs: Object.fromEntries(
			getFeedbackGlyphColors(colors).map((_, index) => [index, coordinates(ICON_BACKGROUND_NAMES.length + index)])
		),
	};
}
