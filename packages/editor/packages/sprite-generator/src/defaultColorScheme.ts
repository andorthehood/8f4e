import type { ColorScheme } from './types';

/**
 * Default fallback color scheme used when no color scheme is specified
 */
const defaultColorScheme: ColorScheme = {
	text: {
		lineNumber: '#999999',
		instruction: '#ffffff',
		codeComment: '#999999',
		code: '#ffffff',
		disabledCode: '#cccccc',
		numbers: '#ffffff',
		menuItemText: '#ffffff',
		menuItemTextHighlighted: '#000000',
		dialogText: '#ffffff',
		dialogTitle: '#ffffff',
		binaryZero: '#ffffff',
		binaryOne: '#ffffff',
	},
	fill: {
		menuItemBackground: '#000000',
		menuItemBackgroundHighlighted: '#ffffff',
		background: 'rgba(0,0,0,0)',
		backgroundDots: '#000000',
		backgroundDots2: '#000000',
		moduleBackground: 'rgba(0,0,0,0.9)',
		moduleBackgroundDragged: 'rgba(0,0,0,1)',
		moduleBackgroundDisabled: 'rgba(0,0,0,0.9)',
		wire: '#cccccc',
		wireHighlighted: '#ffffff',
		errorMessageBackground: '#999999',
		dialogBackground: '#ffffff',
		dialogDimmer: 'rgba(0,0,0,0.7)',
		highlightedCodeLine: '#000000',
		plotterBackground: '#ffffff',
		plotterTrace: '#000000',
		scanLine: '#ffffff',
		sliderThumb: '#ffffff',
		codeBlockHighlightLevel1: '#000000',
		codeBlockHighlightLevel2: '#000000',
		codeBlockHighlightLevel3: '#000000',
	},
	icons: {
		outputConnectorBackground: '#000000',
		inputConnectorBackground: '#000000',
		switchBackground: '#000000',
		inputConnector: '#ffffff',
		outputConnector: '#ffffff',
		feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
		arrow: '#ffffff',
		pianoKeyWhite: '#000000',
		pianoKeyWhiteHighlighted: '#ff0000',
		pianoKeyWhitePressed: '#000000',
		pianoKeyBlack: '#ffffff',
		pianoKeyBlackHighlighted: '#ff0000',
		pianoKeyBlackPressed: '#ffffff',
		pianoKeyboardBackground: '#000000',
		pianoKeyboardNote: '#000000',
		pianoKeyboardNoteHighlighted: '#ff0000',
	},
};

export default defaultColorScheme;
