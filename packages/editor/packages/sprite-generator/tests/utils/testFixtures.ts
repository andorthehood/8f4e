import type { Config, ColorScheme } from '../../src/types';

/**
 * Test fixture for a minimal color scheme
 */
export const minimalColorScheme: ColorScheme = {
	text: {
		lineNumber: '#333333',
		debugInfo: '#333333',
		arrow: '#ffffff',
		instruction: '#887ecb',
		codeComment: '#666666',
		code: '#ffffff',
		errorMessage: '#ffffff',
		disabledCode: 'rgba(0,0,0,0.5)',
		numbers: '#c9d487',
		menuItemText: '#ffffff',
		menuItemTextHighlighted: '#000000',
		dialogText: '#ffffff',
		dialogTitle: '#ffffff',
		binaryZero: '#c9d487',
		binaryOne: '#c9d487',
		basePrefix: '#c9d487',
	},
	fill: {
		menuItemBackground: '#000000',
		menuItemBackgroundHighlighted: '#ffffff',
		background: '#000000',
		backgroundDots: '#999999',
		backgroundDots2: '#333333',
		debugInfoBackground: '#000000',
		moduleBackground: '#000000',
		moduleBackgroundDragged: 'rgba(0,0,0,0.8)',
		moduleBackgroundDisabled: 'rgba(0,0,0,0)',
		wire: '#ffffff',
		wireHighlighted: '#ffffff',
		errorMessageBackground: '#ff0000',
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.5)',
		highlightedCodeLine: '#333333',
		trace: '#ffffff',
		plotterBackground: 'rgba(0,0,0,0)',
		waveform: 'rgba(255,255,255,0.45)',
		meterGreen: '#33cc66',
		meterYellow: '#ffcc33',
		meterRed: '#ff5533',
		scanLine: '#ffffff',
		sliderThumb: '#ffffff',
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
		feedbackScale0: '#ff0000',
		feedbackScale1: '#cc0033',
		feedbackScale2: '#990066',
		feedbackScale3: '#660099',
		feedbackScale4: '#3300cc',
		feedbackScale5: '#0000ff',
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
 * Test fixture for attpc63008x16 font configuration
 */
export const configAttPc63008x16: Config = {
	font: 'attpc63008x16',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for nix8810m168x16 font configuration
 */
export const configNix8810M168x16: Config = {
	font: 'nix8810m168x16',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for olivettithin8x16 font configuration
 */
export const configOlivettiThin8x16: Config = {
	font: 'olivettithin8x16',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for ibmvga8x16 font configuration
 */
export const config8x16: Config = {
	font: 'ibmvga8x16',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for terminus8x16 font configuration
 */
export const configTerminus8x16: Config = {
	font: 'terminus8x16',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for terminus8x16bold font configuration
 */
export const configTerminus8x16Bold: Config = {
	font: 'terminus8x16bold',
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
 * Test fixture for terminus10x18 font configuration
 */
export const configTerminus10x18: Config = {
	font: 'terminus10x18',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for terminus10x18bold font configuration
 */
export const configTerminus10x18Bold: Config = {
	font: 'terminus10x18bold',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for kana12x13 font configuration
 */
export const configKana12x13: Config = {
	font: 'kana12x13',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for terminus12x24 font configuration
 */
export const configTerminus12x24: Config = {
	font: 'terminus12x24',
	colorScheme: minimalColorScheme,
};

/**
 * Test fixture for terminus12x24bold font configuration
 */
export const configTerminus12x24Bold: Config = {
	font: 'terminus12x24bold',
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

/**
 * Standard character dimensions for terminus10x18 font
 */
export const characterDimensionsTerminus10x18 = {
	width: 10,
	height: 18,
};

/**
 * Standard character dimensions for kana12x13 font
 */
export const characterDimensionsKana12x13 = {
	width: 12,
	height: 13,
};

/**
 * Standard character dimensions for terminus12x24 font
 */
export const characterDimensionsTerminus12x24 = {
	width: 12,
	height: 24,
};
