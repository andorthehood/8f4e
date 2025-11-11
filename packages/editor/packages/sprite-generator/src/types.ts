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
		instruction: string;
		codeComment: string;
		code: string;
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
		moduleBackgroundDragged: string;
		wire: string;
		wireHighlighted: string;
		errorMessageBackground: string;
		dialogBackground: string;
		dialogDimmer: string;
		highlightedCodeLine: string;
		plotterTrace: string;
		plotterBackground: string;
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
		feedbackScale: string[];
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

export type Font = '6x10' | '8x16';

export interface Config {
	colorScheme?: ColorScheme;
	font: Font;
}

export type SpriteLookup<T extends string = string> = Record<T, SpriteCoordinates>;
