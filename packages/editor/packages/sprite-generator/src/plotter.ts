import { SpriteCoordinates } from 'glugglug';

import { createAtlasLayout } from './atlasLayout';
import { ColorScheme, Command, DrawingCommand } from './types';

export default function generate(
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['fill']
): DrawingCommand[] {
	const values = new Array(characterHeight * 8).fill(0).map((item, index) => index);
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, layout.plotter.x, layout.plotter.y],
		[Command.FILL_COLOR, colors.plotterBackground],
		[Command.RECTANGLE, 0, 0, layout.plotter.width, layout.plotter.height],
		[Command.FILL_COLOR, colors.plotterTrace],
		...values.map((value): DrawingCommand => {
			return [Command.RECTANGLE, value, characterHeight * 8 - value, 1, 1];
		}),
	];
}

export const generateLookup = function (
	characterWidth: number,
	characterHeight: number
): Record<number, SpriteCoordinates> {
	const values = new Array(characterHeight * 8).fill(0).map((item, index) => index);
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return Object.fromEntries(
		values.map(value => [
			value,
			{
				x: layout.plotter.x + value,
				y: layout.plotter.y,
				spriteWidth: 1,
				spriteHeight: characterHeight * 8,
			},
		])
	);
};
