import { Engine } from '@8f4e/2d-engine';

import type { State } from '../../state/types';

export default function drawBackground(engine: Engine, state: State): void {
	engine.setSpriteLookup(state.graphicHelper.spriteLookups.background);

	for (
		let i = 0;
		i < Math.ceil(state.graphicHelper.globalViewport.width / (64 * state.graphicHelper.globalViewport.vGrid));
		i++
	) {
		for (
			let j = 0;
			j < Math.ceil(state.graphicHelper.globalViewport.height / (32 * state.graphicHelper.globalViewport.hGrid));
			j++
		) {
			engine.drawSprite(
				64 * state.graphicHelper.globalViewport.vGrid * i,
				32 * state.graphicHelper.globalViewport.hGrid * j,
				0
			);
		}
	}
}
