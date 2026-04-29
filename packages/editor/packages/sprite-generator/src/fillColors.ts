import { SpriteCoordinates } from 'glugglug';

import { createAtlasLayout, FILL_COLOR_NAMES } from './atlasLayout';
import { ColorScheme, Command, DrawingCommand } from './types';

export type FillSpriteColorName = (typeof FILL_COLOR_NAMES)[number];

export enum Icon {
	INPUT,
	SWITCH_OFF,
	SWITCH_ON,
}

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
