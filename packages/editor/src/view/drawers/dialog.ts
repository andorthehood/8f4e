import { Engine } from '@8f4e/2d-engine';

import { State } from '../../state/types';

export default function drawDialog(engine: Engine, state: State): void {
	const { show } = state.graphicHelper.dialog;

	if (!show || !state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
	engine.startGroup(0, 0);
	engine.drawSprite(
		0,
		0,
		'dialogDimmer',
		state.graphicHelper.globalViewport.width,
		state.graphicHelper.globalViewport.height
	);

	engine.drawSprite(100, 100, 'dialogBackground', 100, 100);

	engine.endGroup();
}
