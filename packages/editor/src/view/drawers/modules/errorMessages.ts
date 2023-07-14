import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawErrorMessages(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, message }] of module.errorMessages) {
		engine.setSpriteLookup(fillColor);
		engine.drawSprite(
			x,
			y,
			'errorMessageBackground',
			module.width,
			message.length * state.graphicHelper.viewport.hGrid
		);

		engine.setSpriteLookup(font('code'));
		for (let i = 0; i < message.length; i++) {
			engine.drawText(x, y + i * state.graphicHelper.viewport.hGrid, ' ' + message[i]);
		}
	}
}
