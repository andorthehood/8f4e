import type { ColorScheme } from './types';

/**
 * Default fallback color scheme used when no color scheme is specified
 */
const defaultColorScheme: ColorScheme = {
	text: {
		lineNumber: 'rgba(51,51,51,255)',
		instruction: 'rgba(136,126,203,255)',
		codeComment: 'rgba(102,102,102,255)',
		code: 'rgba(255,255,255,255)',
		numbers: 'rgba(201,212,135,255)',
		menuItemText: 'rgba(255,255,255,255)',
		menuItemTextHighlighted: 'rgba(0,0,0,255)',
		dialogText: '#ffffff',
		dialogTitle: '#ffffff',
		binaryZero: 'rgba(201,212,135,255)',
		binaryOne: 'rgba(201,212,135,255)',
	},
	fill: {
		menuItemBackground: 'rgba(0,0,0,255)',
		menuItemBackgroundHighlighted: 'rgba(255,255,255,255)',
		background: '#000000',
		backgroundDots: '#444444',
		backgroundDots2: '#444444',
		moduleBackground: '#000000',
		moduleBackgroundDragged: 'rgba(0,0,0,0.8)',
		moduleBackgroundDisabled: 'rgba(0,0,0,0)',
		wire: '#ffffff',
		wireHighlighted: '#ffffff',
		errorMessageBackground: '#cc0000',
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.5)',
		highlightedCodeLine: '#333333',
		plotterBackground: '#001100',
		plotterTrace: '#66ff66',
		scanLine: '#ff0000',
		codeBlockHighlightLevel1: '#111111',
		codeBlockHighlightLevel2: '#222222',
		codeBlockHighlightLevel3: '#333333',
	},
	icons: {
		outputConnectorBackground: '#003300',
		inputConnectorBackground: '#003300',
		switchBackground: '#003300',
		inputConnector: '#ffffff',
		outputConnector: '#ffffff',
		feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
		arrow: '#ffffff',
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

export default defaultColorScheme;
