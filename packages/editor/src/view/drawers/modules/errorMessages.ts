import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';
import { HGRID } from '../consts';

export default function drawErrorMessages(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, message }] of module.errorMessages) {
		engine.setSpriteLookup(fillColor);
		engine.drawSprite(x, y, 'rgb(51,0,0)', module.width, message.length * HGRID);

		engine.setSpriteLookup(font('white'));
		for (let i = 0; i < message.length; i++) {
			engine.drawText(x, y + i * HGRID, ' ' + message[i]);
		}
	}
}
