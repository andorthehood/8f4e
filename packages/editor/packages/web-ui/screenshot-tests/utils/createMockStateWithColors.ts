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
 * Create a mock state for web-ui screenshot tests.
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
		featureFlags: {
			contextMenu: true,
			infoOverlay: false,
			moduleDragging: false,
			codeLineSelection: true,
			viewportDragging: false,
			editing: false,
			modeToggling: true,
		},
		editorMode: 'view',
		...overrides,
	});

	// Generate sprite data and populate state
	const spriteData = await generateSprite({
		font: state.editorConfig.font,
		colorScheme: state.editorConfig.color,
	});

	updateStateWithSpriteData(state, spriteData);

	return state;
}
