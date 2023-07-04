import { Engine } from '@8f4e/2d-engine';
import { fillColor } from '@8f4e/sprite-generator';
import { State } from '../../state/types';

export default function drawDialog(engine: Engine, state: State): void {
	const { show } = state.graphicHelper.dialog;

	if (!show) {
		return;
	}

	engine.setSpriteLookup(fillColor);
	engine.startGroup(0, 0);
	engine.drawSprite(0, 0, 'dialogDimmer', state.project.viewport.width, state.project.viewport.height);

	engine.drawSprite(100, 100, 'dialogBackground', 100, 100);

	engine.endGroup();
}
