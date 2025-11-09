import { createMockState } from '@8f4e/editor-state/testing';

import type { State } from '@8f4e/editor-state';

/**
 * Default color scheme for web-ui screenshot tests
 */
const defaultColorScheme = {
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
		backgroundDots: '#333333',
		backgroundDots2: '#444444',
		moduleBackground: '#000000',
		moduleBackgroundDragged: 'rgba(0,0,0,0.8)',
		wire: '#ffffff',
		wireHighlighted: '#ffffff',
		errorMessageBackground: '#cc0000',
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.5)',
		highlightedCodeLine: '#333333',
		plotterBackground: '#001100',
		plotterTrace: '#66ff66',
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

/**
 * Create a mock state for web-ui screenshot tests with default color scheme.
 * Extends the base createMockState from editor-state with web-ui specific defaults.
 *
 * @param overrides Optional partial state to override defaults
 * @returns A complete State object with web-ui defaults including color scheme
 *
 * @example
 * ```typescript
 * const state = createMockStateWithColors();
 * const state = createMockStateWithColors({ featureFlags: { editing: false } });
 * ```
 */
export default function createMockStateWithColors(overrides: Partial<State> = {}): State {
	return createMockState({
		colorSchemes: {
			default: defaultColorScheme,
		},
		featureFlags: {
			contextMenu: true,
			infoOverlay: false,
			moduleDragging: false,
			viewportDragging: false,
			persistentStorage: false,
			editing: false,
			demoMode: false,
			viewportAnimations: false,
		},
		...overrides,
	});
}
