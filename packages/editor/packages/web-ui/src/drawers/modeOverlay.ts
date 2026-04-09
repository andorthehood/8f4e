import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawModeOverlay(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	if (!state.featureFlags.modeToggling) {
		return;
	}

	const modeHint =
		state.editorMode === 'edit'
			? "You're in edit mode, press ESC to enter view mode"
			: state.editorMode === 'presentation'
				? "You're in presentation mode, press ESC to enter view mode"
				: "You're in view mode, press e to edit or p to present";

	engine.startGroup(0, 0);
	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
	engine.drawSprite(0, 0, 'debugInfoBackground', (modeHint.length + 2) * state.viewport.vGrid, state.viewport.hGrid);
	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontDebugInfo);
	engine.drawText(state.viewport.vGrid, 0, modeHint);
	engine.endGroup();
}
