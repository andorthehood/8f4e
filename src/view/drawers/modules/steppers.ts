import { Engine } from '@8f4e/2d-engine';
import { fillColor, font } from '@8f4e/sprite-generator';

import { State, Stepper } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawSteppers(engine: Engine, steppers: Stepper[], state: State, id: string): void {
	for (let i = 0; i < steppers.length; i++) {
		const stepper = steppers[i];

		engine.setSpriteLookup(fillColor);
		engine.drawSprite(stepper.x, stepper.y, 'rgb(255,255,255)', VGRID * 3, HGRID);
		engine.setSpriteLookup(font('black'));
		engine.drawText(stepper.x + VGRID, stepper.y, '-');

		engine.setSpriteLookup(fillColor);
		engine.drawSprite(stepper.x + VGRID * 4, stepper.y, 'rgb(255,255,255)', VGRID * 3, HGRID);
		engine.setSpriteLookup(font('black'));
		engine.drawText(stepper.x + VGRID * 5, stepper.y, '+');

		const address = state.compiler.memoryAddressLookup[id][stepper.id];
		const value = state.compiler.memoryBuffer[address];

		engine.setSpriteLookup(font('white'));
		engine.drawText(
			stepper.x + VGRID * 8,
			stepper.y,
			(stepper.label || stepper.id) + ': ' + (stepper.textValue || value)
		);
	}
}
