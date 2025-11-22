import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';

export default function drawErrorMessages(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const { x, y, message } of codeBlock.extras.errorMessages) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(
			x,
			y,
			'errorMessageBackground',
			codeBlock.width,
			message.length * state.graphicHelper.viewport.hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		for (let i = 0; i < message.length; i++) {
			engine.drawText(x, y + i * state.graphicHelper.viewport.hGrid, ' ' + message[i]);
		}
	}
}
