import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { Engine } from 'glugglug';

export default function drawBlockHighlights(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	if (!state.spriteLookups || codeBlock.disabled) {
		return;
	}

	for (const { x, y, width, height, color } of codeBlock.widgets.blockHighlights) {
		engine.setSpriteLookup(state.spriteLookups.fillColors);

		engine.drawSprite(x, y, color, width, height);
	}
}
