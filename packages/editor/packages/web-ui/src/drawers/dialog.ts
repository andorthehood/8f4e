import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

export default function drawDialog(engine: Engine, state: State): void {
	const { show } = state.dialog;

	if (!show || !state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
	engine.startGroup(0, 0);
	engine.drawSprite(0, 0, 'dialogDimmer', state.viewport.width, state.viewport.height);
	engine.endGroup();

	engine.startGroup(state.dialog.x, state.dialog.y);

	engine.drawSprite(0, 0, 'dialogBackground', state.dialog.width, state.dialog.height);

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

	const corner = '+';
	engine.drawText(0, 0, corner);
	engine.drawText(state.dialog.width - state.viewport.vGrid, 0, corner);
	engine.drawText(0, state.dialog.height - state.viewport.hGrid, corner);
	engine.drawText(state.dialog.width - state.viewport.vGrid, state.dialog.height - state.viewport.hGrid, corner);

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontDialogTitle);
	engine.drawText(state.viewport.vGrid, state.viewport.hGrid, state.dialog.title);
	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontDialogText);

	for (let i = 0; i < state.dialog.wrappedText.length; i++) {
		const textY = state.viewport.hGrid * (3 + i);
		engine.drawText(state.viewport.vGrid, textY, state.dialog.wrappedText[i]);
	}

	engine.endGroup();
}
