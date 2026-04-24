import { Engine } from 'glugglug';

import type { State } from '@8f4e/editor-state';

const HORIZONTAL_MATTE_GRID_CELLS = 2;
const VERTICAL_MATTE_GRID_CELLS = 4;

export default function drawRecordingMatte(engine: Engine, state: State): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const horizontalThickness = Math.min(
		state.viewport.hGrid * HORIZONTAL_MATTE_GRID_CELLS,
		Math.floor(state.viewport.height / 2)
	);
	const verticalThickness = Math.min(
		state.viewport.vGrid * VERTICAL_MATTE_GRID_CELLS,
		Math.floor(state.viewport.width / 2)
	);
	const verticalY = horizontalThickness;
	const verticalHeight = state.viewport.height - horizontalThickness * 2;

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
	engine.drawSprite(0, 0, 'recordingMatte', state.viewport.width, horizontalThickness);
	engine.drawSprite(
		0,
		state.viewport.height - horizontalThickness,
		'recordingMatte',
		state.viewport.width,
		horizontalThickness
	);

	if (verticalHeight <= 0) {
		return;
	}

	engine.drawSprite(
		state.viewport.width - verticalThickness,
		verticalY,
		'recordingMatte',
		verticalThickness,
		verticalHeight
	);
	engine.drawSprite(0, verticalY, 'recordingMatte', verticalThickness, verticalHeight);
}
