import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import { State, Stepper } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawSteppers(engine: Engine, steppers: Stepper[], state: State, id: string): void {
	for (let i = 0; i < steppers.length; i++) {
		const stepper = steppers[i];

		engine.startGroup(stepper.x, stepper.y);
		engine.setSpriteLookup(fillColor);
		engine.drawSprite(0, 0, 'rgb(255,255,255)', VGRID * 3, HGRID);
		engine.setSpriteLookup(font('black'));
		engine.drawText(VGRID, 0, '-');

		engine.setSpriteLookup(fillColor);
		engine.drawSprite(VGRID * 4, 0, 'rgb(255,255,255)', VGRID * 3, HGRID);
		engine.setSpriteLookup(font('black'));
		engine.drawText(VGRID * 5, 0, '+');

		const address = state.compiler.memoryAddressLookup[id][stepper.id];
		const value = state.compiler.memoryBuffer[address];

		engine.setSpriteLookup(font('white'));
		engine.drawText(VGRID * 8, 0, (stepper.label || stepper.id) + ': ' + (stepper.textValue || value));
		engine.endGroup();
	}
}
