import type { Config, ColorScheme } from '../../src/types';

/**
 * Test fixture for a minimal color scheme
 */
export const minimalColorScheme: ColorScheme = {
	text: {
		lineNumber: '#333333',
		instruction: '#887ecb',
		codeComment: '#666666',
		code: '#ffffff',
		disabledCode: 'rgba(0,0,0,0.5)',
		numbers: '#c9d487',
		menuItemText: '#ffffff',
		menuItemTextHighlighted: '#000000',
		dialogText: '#ffffff',
		dialogTitle: '#ffffff',
		binaryZero: '#c9d487',
		binaryOne: '#c9d487',
	},
	fill: {
		menuItemBackground: '#000000',
		menuItemBackgroundHighlighted: '#ffffff',
		background: '#000000',
		backgroundDots: '#999999',
		backgroundDots2: '#333333',
		moduleBackground: '#000000',
		moduleBackgroundDragged: 'rgba(0,0,0,0.8)',
		moduleBackgroundDisabled: 'rgba(0,0,0,0)',
		wire: '#ffffff',
		wireHighlighted: '#ffffff',
		errorMessageBackground: '#ff0000',
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.5)',
		highlightedCodeLine: '#333333',
		plotterTrace: '#ffffff',
		plotterBackground: '#000000',
		codeBlockHighlightLevel1: '#333300',
		codeBlockHighlightLevel2: '#333333',
		codeBlockHighlightLevel3: '#003333',
	},
	icons: {
		inputConnector: '#ffffff',
		outputConnector: '#ffffff',
		inputConnectorBackground: '#111111',
		outputConnectorBackground: '#111111',
		switchBackground: '#336699',
		feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
		arrow: '#000000',
		pianoKeyWhite: '#ffffff',
		pianoKeyWhiteHighlighted: '#ff0000',
		pianoKeyWhitePressed: '#cccccc',
		pianoKeyBlack: '#000000',
		pianoKeyBlackHighlighted: '#ff0000',
		pianoKeyBlackPressed: '#333333',
		pianoKeyboardBackground: '#999999',
		pianoKeyboardNote: '#ffffff',
		pianoKeyboardNoteHighlighted: '#ff0000',
	},
};

/**
 * Test fixture for 8x16 font configuration
 */
export const config8x16: Config = {
	font: '8x16',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for 6x10 font configuration
 */
export const config6x10: Config = {
	font: '6x10',
	colorScheme: minimalColorScheme,
};

/**
 * Standard character dimensions for 8x16 font
 */
export const characterDimensions8x16 = {
	width: 8,
	height: 16,
};

/**
 * Standard character dimensions for 6x10 font
 */
export const characterDimensions6x10 = {
	width: 6,
	height: 10,
};
