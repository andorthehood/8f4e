import type { State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../drawContext';

export default function drawBackground(engine: DrawContext, state: State): void {
	if (!state.spriteLookups) {
		return;
	}

	for (let i = 0; i < Math.ceil(state.viewport.width / (64 * state.viewport.vGrid)); i++) {
		for (let j = 0; j < Math.ceil(state.viewport.height / (32 * state.viewport.hGrid)); j++) {
			engine.drawSprite(
				64 * state.viewport.vGrid * i,
				32 * state.viewport.hGrid * j,
				state.spriteLookups.background[0]
			);
		}
	}
}
