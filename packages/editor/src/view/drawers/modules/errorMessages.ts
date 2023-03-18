import { Engine } from '@8f4e/2d-engine';
import { font } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';
import { HGRID } from '../consts';

export default function drawErrorMessages(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, message }] of module.errorMessages) {
		engine.setSpriteLookup(font('white'));

		for (let i = 0; i < message.length; i++) {
			engine.drawText(x, y + i * HGRID, message[i]);
		}
	}
}
