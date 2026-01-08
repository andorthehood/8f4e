import type { State } from '@8f4e/editor-state';
import type { SpriteData } from '@8f4e/web-ui';

/**
 * Updates the state with sprite data from a generated sprite sheet.
 *
 * Note: hGrid represents horizontal grid lines (vertical spacing = character height)
 *       vGrid represents vertical grid lines (horizontal spacing = character width)
 *
 * @param state The editor state to update
 * @param spriteData The sprite data containing lookups and character dimensions
 */
export function updateStateWithSpriteData(state: State, spriteData: SpriteData): void {
	state.graphicHelper.spriteLookups = spriteData.spriteLookups;
	state.graphicHelper.viewport.hGrid = spriteData.characterHeight;
	state.graphicHelper.viewport.vGrid = spriteData.characterWidth;
}
