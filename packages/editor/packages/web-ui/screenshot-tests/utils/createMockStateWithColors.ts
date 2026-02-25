import { createMockState } from '@8f4e/editor-state/testing';
import generateSprite from '@8f4e/sprite-generator';

import type { State } from '@8f4e/editor-state';
import type { SpriteData } from '../../src';

/**
 * Updates the state with sprite data from a generated sprite sheet.
 * This is a helper function to reduce duplication in test setup.
 */
function updateStateWithSpriteData(state: State, spriteData: SpriteData): void {
	state.graphicHelper.spriteLookups = spriteData.spriteLookups;
	state.viewport.hGrid = spriteData.characterHeight;
	state.viewport.vGrid = spriteData.characterWidth;
}

/**
 * Default color scheme for web-ui screenshot tests
 */
const defaultColorScheme = {
	text: {
		lineNumber: 'rgba(51,51,51,255)',
		instruction: 'rgba(136,126,203,255)',
		codeComment: 'rgba(102,102,102,255)',
		code: 'rgba(255,255,255,255)',
		disabledCode: 'rgba(0,0,0,0.5)',
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
		moduleBackgroundDisabled: 'rgba(0,0,0,0)',
		wire: '#ffffff',
		wireHighlighted: '#ffffff',
		errorMessageBackground: '#cc0000',
		dialogBackground: '#000000',
		dialogDimmer: 'rgba(0,0,0,0.5)',
		highlightedCodeLine: '#333333',
		plotterBackground: '#001100',
		plotterTrace: '#66ff66',
		codeBlockHighlightLevel1: '#333300',
		codeBlockHighlightLevel2: '#333333',
		codeBlockHighlightLevel3: '#003333',
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
 * Also generates sprite data and populates spriteLookups, hGrid, and vGrid.
 *
 * @param overrides Optional partial state to override defaults
 * @returns A complete State object with web-ui defaults including color scheme and sprite data
 *
 * @example
 * ```typescript
 * const state = await createMockStateWithColors();
 * const state = await createMockStateWithColors({ featureFlags: { editing: false } });
 * ```
 */
export default async function createMockStateWithColors(overrides: Partial<State> = {}): Promise<State> {
	const state = createMockState({
		colorScheme: defaultColorScheme,
		compiledProjectConfig: {
			...createMockState().compiledProjectConfig,
			colorScheme: defaultColorScheme,
		},
		featureFlags: {
			contextMenu: true,
			infoOverlay: false,
			moduleDragging: false,
			codeLineSelection: true,
			viewportDragging: false,
			editing: false,
			modeToggling: true,
			demoMode: false,
			viewportAnimations: false,
		},
		...overrides,
	});

	// Generate sprite data and populate state
	const spriteData = await generateSprite({
		font: state.compiledEditorConfig.font || '8x16',
		colorScheme: state.colorScheme,
	});

	updateStateWithSpriteData(state, spriteData);

	return state;
}
