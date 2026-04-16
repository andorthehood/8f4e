import { SpriteCoordinates } from 'glugglug';

import { createAtlasLayout } from './atlasLayout';
import { drawCharacter } from './font';
import Glyph from './fonts/types';
import { ColorScheme, Command, DrawingCommand } from './types';

type IconCharacter = {
	font: 'ascii' | 'glyphs';
	char: number | string;
};

const ascii = (char: string): IconCharacter => ({ font: 'ascii', char });
const glyph = (char: Glyph): IconCharacter => ({ font: 'glyphs', char });

const icons = (
	characterWidth: number,
	characterHeight: number,
	colors?: ColorScheme['icons']
): {
	commandsBeforeRenderingGlyphs: DrawingCommand[];
	chars: IconCharacter[];
	colors: string[];
}[] => [
	{
		commandsBeforeRenderingGlyphs: [
			[Command.FILL_COLOR, colors?.inputConnectorBackground || ''],
			[Command.RECTANGLE, 0, 0, characterWidth * 3, characterHeight],
			[Command.FILL_COLOR, colors?.inputConnector || ''],
		],
		chars: [ascii('['), ascii(' '), ascii(']')],
		colors: [],
	},
	{
		commandsBeforeRenderingGlyphs: [
			[Command.FILL_COLOR, colors?.switchBackground || ''],
			[Command.RECTANGLE, 0, 0, characterWidth * 4, characterHeight],
			[Command.FILL_COLOR, colors?.inputConnector || ''],
		],
		chars: [ascii('['), glyph(Glyph.SWITCH_KNOB), ascii(' '), ascii(']')],
		colors: [],
	},
	{
		commandsBeforeRenderingGlyphs: [
			[Command.FILL_COLOR, colors?.switchBackground || ''],
			[Command.RECTANGLE, 0, 0, characterWidth * 4, characterHeight],
			[Command.FILL_COLOR, colors?.inputConnector || ''],
		],
		chars: [ascii('['), ascii(' '), glyph(Glyph.SWITCH_KNOB), ascii(']')],
		colors: [],
	},
];

export enum Icon {
	INPUT,
	SWITCH_OFF,
	SWITCH_ON,
}

export default function generate(
	asciiFont: number[],
	glyphsFont: number[],
	characterWidth: number,
	characterHeight: number,
	colors: ColorScheme['icons']
): DrawingCommand[] {
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return [
		[Command.RESET_TRANSFORM],
		[Command.TRANSLATE, layout.icons.x, layout.icons.y],
		...icons(characterWidth, characterHeight, colors).flatMap<DrawingCommand>(icon => {
			return [
				...icon.commandsBeforeRenderingGlyphs,
				...icon.chars.flatMap<DrawingCommand>(char => {
					const font = char.font === 'ascii' ? asciiFont : glyphsFont;
					return [
						...drawCharacter(font, char.char, characterWidth, characterHeight),
						[Command.TRANSLATE, characterWidth, 0],
					];
				}),
			];
		}),
	];
}

function generateIconPositions(characterWidth: number, characterHeight: number) {
	const layout = createAtlasLayout(characterWidth, characterHeight);

	return icons(characterWidth, characterHeight).reduce((acc, current) => {
		const length = acc.reduce((acc, icon) => acc + icon[2], 0);
		acc.push([layout.icons.x + length, layout.icons.y, current.chars.length * characterWidth]);
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
