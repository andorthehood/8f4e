import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawModeOverlay(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const modeHint = state.featureFlags.editing
		? "You're in edit mode, press ESC to enter view mode"
		: "You're in view mode, press i to enter edit mode";

	engine.startGroup(0, 0);
	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
	engine.drawSprite(0, 0, 'moduleBackground', (modeHint.length + 2) * state.viewport.vGrid, state.viewport.hGrid);
	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontLineNumber);
	engine.drawText(state.viewport.vGrid, 0, modeHint);
	engine.endGroup();
}
