import { SpriteCoordinates } from 'glugglug';

export enum Command {
	FILL_COLOR,
	RECTANGLE,
	TRANSLATE,
	SAVE,
	RESTORE,
	RESET_TRANSFORM,
	PIXEL,
}

export type DrawingCommand =
	| [command: Command.FILL_COLOR, fillColor: string]
	| [command: Command.RECTANGLE, x: number, y: number, width: number, height: number]
	| [command: Command.TRANSLATE, x: number, y: number]
	| [command: Command.PIXEL, x: number, y: number]
	| [command: Command.SAVE]
	| [command: Command.RESTORE]
	| [command: Command.RESET_TRANSFORM];

export interface ColorScheme {
	text: {
		lineNumber: string;
		debugInfo: string;
		instruction: string;
		codeComment: string;
		code: string;
		errorMessage: string;
		disabledCode: string;
		numbers: string;
		menuItemText: string;
		menuItemTextHighlighted: string;
		dialogTitle: string;
		dialogText: string;
		binaryZero: string;
		binaryOne: string;
	};
	fill: {
		menuItemBackground: string;
		menuItemBackgroundHighlighted: string;
		background: string;
		backgroundDots: string;
		backgroundDots2: string;
		moduleBackground: string;
		debugInfoBackground: string;
		moduleBackgroundDragged: string;
		moduleBackgroundDisabled: string;
		wire: string;
		wireHighlighted: string;
		errorMessageBackground: string;
		dialogBackground: string;
		dialogDimmer: string;
		highlightedCodeLine: string;
		plotterTrace: string;
		plotterBackground: string;
		waveFill: string;
		scanLine: string;
		sliderThumb: string;
		codeBlockHighlightLevel1: string;
		codeBlockHighlightLevel2: string;
		codeBlockHighlightLevel3: string;
	};
	icons: {
		inputConnector: string;
		outputConnector: string;
		inputConnectorBackground: string;
		outputConnectorBackground: string;
		switchBackground: string;
		feedbackScale0: string;
		feedbackScale1: string;
		feedbackScale2: string;
		feedbackScale3: string;
		feedbackScale4: string;
		feedbackScale5: string;
		arrow: string;
		pianoKeyWhite: string;
		pianoKeyWhiteHighlighted: string;
		pianoKeyWhitePressed: string;
		pianoKeyBlack: string;
		pianoKeyBlackHighlighted: string;
		pianoKeyBlackPressed: string;
		pianoKeyboardBackground: string;
		pianoKeyboardNote: string;
		pianoKeyboardNoteHighlighted: string;
	};
}

export const FONT_NAMES = [
	'6x10',
	'spleen5x8',
	'spleen6x12',
	'ibmvga8x16',
	'spleen8x16',
	'terminus8x16',
	'terminus8x16bold',
	'terminus10x18',
	'terminus10x18bold',
	'kana12x13',
	'spleen12x24',
	'terminus12x24',
	'terminus12x24bold',
	'spleen16x32',
] as const;

export type Font = (typeof FONT_NAMES)[number];

export interface Config {
	colorScheme?: ColorScheme;
	font: Font;
}

export type SpriteLookup<T extends string = string> = Record<T, SpriteCoordinates>;
