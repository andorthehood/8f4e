import { SpriteCoordinates } from 'glugglug';

import { drawCharacter } from './font';
import { ColorScheme, Command, DrawingCommand } from './types';
import Glyph from './fonts/types';

const offsetX = 0;
const offsetY = 150;

const icons = (
	characterWidth: number,
	characterHeight: number,
	colors?: ColorScheme['icons']
): { commandsBeforeRenderingGlyphs: DrawingCommand[]; chars: Glyph[]; colors: string[] }[] => [
	{
		commandsBeforeRenderingGlyphs: [
			[Command.FILL_COLOR, colors?.inputConnectorBackground || ''],
			[Command.RECTANGLE, 0, 0, characterWidth * 3, characterHeight],
			[Command.FILL_COLOR, colors?.inputConnector || ''],
		],
		chars: [Glyph.CONNECTOR_LEFT, Glyph.SPACE, Glyph.CONNECTOR_RIGHT],
		colors: [],
	},
	{
		commandsBeforeRenderingGlyphs: [
			[Command.FILL_COLOR, colors?.switchBackground || ''],
			[Command.RECTANGLE, 0, 0, characterWidth * 4, characterHeight],
			[Command.FILL_COLOR, colors?.inputConnector || ''],
		],
		chars: [Glyph.CONNECTOR_LEFT, Glyph.SWITCH_KNOB, Glyph.SPACE, Glyph.CONNECTOR_RIGHT],
		colors: [],
	},
	{
		commandsBeforeRenderingGlyphs: [
			[Command.FILL_COLOR, colors?.switchBackground || ''],
			[Command.RECTANGLE, 0, 0, characterWidth * 4, characterHeight],
			[Command.FILL_COLOR, colors?.inputConnector || ''],
		],
		chars: [Glyph.CONNECTOR_LEFT, Glyph.SPACE, Glyph.SWITCH_KNOB, Glyph.CONNECTOR_RIGHT],
		colors: [],
	},
	{
		commandsBeforeRenderingGlyphs: [],
		chars: [Glyph.ARROW_TOP],
		colors: [colors?.arrow || ''],
	},
	{
		commandsBeforeRenderingGlyphs: [],
		chars: [Glyph.ARROW_RIGHT],
		colors: [colors?.arrow || ''],
	},
	{
		commandsBeforeRenderingGlyphs: [],
		chars: [Glyph.ARROW_BOTTOM],
		colors: [colors?.arrow || ''],
	},
	{
		commandsBeforeRenderingGlyphs: [],
		chars: [Glyph.ARROW_LEFT],
		colors: [colors?.arrow || ''],
	},
];

export enum Icon {
	INPUT,
	SWITCH_OFF,
	SWITCH_ON,
	ARROW_TOP,
	ARROW_RIGHT,
	ARROW_BOTTOM,
	ARROW_LEFT,
}

export default function generate(
	font: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, offsetX, offsetY],
		...icons(characterWidth, characterHeight, colors).flatMap<DrawingCommand>(icon => {
			return [
				...icon.commandsBeforeRenderingGlyphs,
				...icon.chars.flatMap<DrawingCommand>(char => {
					return [
						...drawCharacter(font, char, characterWidth, characterHeight),
						[Command.TRANSLATE, characterWidth, 0],
					];
				}),
			];
		}),
	];
}

function generateIconPositions(characterWidth: number, characterHeight: number) {
	return icons(characterWidth, characterHeight).reduce((acc, current) => {
		const length = acc.reduce((acc, icon) => acc + icon[2], 0);
		acc.push([offsetX + length, offsetY, current.chars.length * characterWidth]);
		return acc;
	}, [] as number[][]);
}

export const generateLookup = function (characterWidth: number, characterHeight: number) {
	const iconPositions = generateIconPositions(characterWidth, characterHeight);

	return Object.fromEntries(
		icons(characterWidth, characterHeight).map((icon, index) => {
			return [
				index,
				{
					x: iconPositions[index][0],
					y: iconPositions[index][1],
					spriteWidth: iconPositions[index][2],
					spriteHeight: characterHeight,
				},
			];
		})
	) as Record<Icon, SpriteCoordinates>;
};
