import generateSprite from '@8f4e/sprite-generator';

import type { SpriteData } from '@8f4e/web-ui';
import type { State } from '@8f4e/editor-state';

/**
 * Generate sprite data for testing
 * @param state The state object to get font and color scheme from
 * @returns SpriteData for use in web-ui init
 */
export default function createMockSpriteData(state: State): SpriteData {
	return generateSprite({
		font: state.compiledEditorConfig.font || '8x16',
		colorScheme: state.colorScheme,
	});
}
