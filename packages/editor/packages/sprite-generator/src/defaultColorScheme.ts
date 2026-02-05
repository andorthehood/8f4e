import type { ColorScheme } from './types';

/**
 * Default fallback color scheme used when no color scheme is specified
 */
const defaultColorScheme: ColorScheme = {
	text: {
		lineNumber: '#999999',
		instruction: '#000000',
		codeComment: '#999999',
		code: '#000000',
		disabledCode: '#cccccc',
		numbers: '#000000',
		menuItemText: '#000000',
		menuItemTextHighlighted: '#ffffff',
		dialogText: '#000000',
		dialogTitle: '#000000',
		binaryZero: '#000000',
		binaryOne: '#000000',
	},
	fill: {
		menuItemBackground: '#ffffff',
		menuItemBackgroundHighlighted: '#000000',
		background: 'rgba(0,0,0,0)',
		backgroundDots: '#ffffff',
		backgroundDots2: '#ffffff',
		moduleBackground: 'rgba(255,255,255,0.9)',
		moduleBackgroundDragged: 'rgba(255,255,255,1)',
		moduleBackgroundDisabled: 'rgba(255,255,255,0.9)',
		wire: '#333333',
		wireHighlighted: '#000000',
		errorMessageBackground: '#999999',
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.7)',
		highlightedCodeLine: '#ffffff',
		plotterBackground: '#000000',
		plotterTrace: '#ffffff',
		scanLine: '#000000',
		sliderThumb: '#000000',
		codeBlockHighlightLevel1: '#ffffff',
		codeBlockHighlightLevel2: '#ffffff',
		codeBlockHighlightLevel3: '#ffffff',
	},
	icons: {
		outputConnectorBackground: '#ffffff',
		inputConnectorBackground: '#ffffff',
		switchBackground: '#ffffff',
		inputConnector: '#000000',
		outputConnector: '#000000',
		feedbackScale: ['#ff0000', '#cc0033', '#990066', '#660099', '#3300cc', '#0000ff'],
		arrow: '#000000',
		pianoKeyWhite: '#ffffff',
		pianoKeyWhiteHighlighted: '#ff0000',
		pianoKeyWhitePressed: '#ffffff',
		pianoKeyBlack: '#000000',
		pianoKeyBlackHighlighted: '#ff0000',
		pianoKeyBlackPressed: '#000000',
		pianoKeyboardBackground: '#006600',
		pianoKeyboardNote: '#ffffff',
		pianoKeyboardNoteHighlighted: '#ff0000',
	},
};

export default defaultColorScheme;
