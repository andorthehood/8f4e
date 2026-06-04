import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { Engine } from 'glugglug';

export default function drawErrorMessages(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	if (!state.spriteLookups) {
		return;
	}

	for (const { x, y, message } of codeBlock.widgets.errorMessages) {
		engine.setSpriteLookup(state.spriteLookups.fillColors);
		engine.drawSprite(x, y, 'errorMessageBackground', codeBlock.width, message.length * state.viewport.hGrid);

		engine.setSpriteLookup(state.spriteLookups.fontErrorMessage);
		for (let i = 0; i < message.length; i++) {
			engine.drawText(x, y + i * state.viewport.hGrid, message[i]);
		}
	}
}
