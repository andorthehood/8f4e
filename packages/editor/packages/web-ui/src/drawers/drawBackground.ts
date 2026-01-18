import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawBackground(engine: Engine, state: State): void {
	if (state.graphicHelper.spriteLookups?.background) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.background);
	}

	for (let i = 0; i < Math.ceil(state.viewport.width / (64 * state.viewport.vGrid)); i++) {
		for (let j = 0; j < Math.ceil(state.viewport.height / (32 * state.viewport.hGrid)); j++) {
			engine.drawSprite(64 * state.viewport.vGrid * i, 32 * state.viewport.hGrid * j, 0);
		}
	}
}
