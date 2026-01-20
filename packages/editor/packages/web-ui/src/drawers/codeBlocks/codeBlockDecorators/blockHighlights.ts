import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';

export default function drawBlockHighlights(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	if (!state.graphicHelper.spriteLookups || codeBlock.disabled) {
		return;
	}

	for (const { x, y, width, height, color } of codeBlock.extras.blockHighlights) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

		engine.drawSprite(x, y, color, width, height);
	}
}
