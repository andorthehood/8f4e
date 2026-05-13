import { SpriteCoordinates } from 'glugglug';

import { createAtlasLayout, FILL_COLOR_NAMES } from './atlasLayout.ts';
import { ColorScheme, Command, DrawingCommand } from './types.ts';

export type FillSpriteColorName = (typeof FILL_COLOR_NAMES)[number];

export const Icon = {
	INPUT: 0,
	SWITCH_OFF: 1,
	SWITCH_ON: 2,
} as const;

export type IconValue = (typeof Icon)[keyof typeof Icon];

export default function generate(
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['fill']
): DrawingCommand[] {
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, layout.fillColors.x, layout.fillColors.y],
		...FILL_COLOR_NAMES.flatMap<DrawingCommand>(color => {
			return [
				[Command.FILL_COLOR, colors[color]],
				[Command.RECTANGLE, 0, 0, characterWidth, characterHeight],
				[Command.TRANSLATE, characterWidth, 0],
			];
		}),
	];
}

export const generateLookup = function (characterWidth: number, characterHeight: number) {
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return Object.fromEntries(
		FILL_COLOR_NAMES.map((color, index) => [
			color,
			{
				x: layout.fillColors.x + index * characterWidth,
				y: layout.fillColors.y,
				spriteWidth: characterWidth,
				spriteHeight: characterHeight,
			},
		])
	) as Record<FillSpriteColorName, SpriteCoordinates>;
};
