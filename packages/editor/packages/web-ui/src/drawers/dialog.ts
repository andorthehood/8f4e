import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawDialog(engine: Engine, state: State): void {
	const { show } = state.graphicHelper.dialog;

	if (!show || !state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
	engine.startGroup(0, 0);
	engine.drawSprite(0, 0, 'dialogDimmer', state.graphicHelper.viewport.width, state.graphicHelper.viewport.height);

	engine.drawSprite(100, 100, 'dialogBackground', 100, 100);

	engine.endGroup();
}
