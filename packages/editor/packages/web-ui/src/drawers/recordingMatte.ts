import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

const HORIZONTAL_MATTE_GRID_CELLS = 2;
const VERTICAL_MATTE_GRID_CELLS = 4;

export default function drawRecordingMatte(engine: Engine, state: State): void {
	if (state.editorMode !== 'recording') {
		return;
	}

	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const horizontalThickness = state.viewport.hGrid * HORIZONTAL_MATTE_GRID_CELLS;
	const verticalThickness = state.viewport.vGrid * VERTICAL_MATTE_GRID_CELLS;

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
	engine.drawSprite(0, 0, 'recordingMatte', state.viewport.width, horizontalThickness);
	engine.drawSprite(
		state.viewport.width - verticalThickness,
		0,
		'recordingMatte',
		verticalThickness,
		state.viewport.height
	);
	engine.drawSprite(
		0,
		state.viewport.height - horizontalThickness,
		'recordingMatte',
		state.viewport.width,
		horizontalThickness
	);
	engine.drawSprite(0, 0, 'recordingMatte', verticalThickness, state.viewport.height);
}
