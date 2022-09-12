import { Engine } from '@8f4e/2d-engine';
import { State, Stepper } from '../../../state/types';
import { font } from '@8f4e/sprite-generator';
import { VGRID } from '../consts';

export default function drawSteppers(engine: Engine, steppers: Stepper[], state: State, id: string): void {
	for (let i = 0; i < steppers.length; i++) {
		const stepper = steppers[i];

		engine.setSpriteLookup(font('icons'));
		engine.drawText(stepper.x, stepper.y, '$%');
		engine.drawText(stepper.x + VGRID * 2, stepper.y, '$%');

		//engine.setSpriteLookup(fillColor);
		//engine.drawRectangle(stepper.x, stepper.y, VGRID, HGRID, 'rgb(255,255,255)');

		const address = state.compiler.memoryAddressLookup[id][stepper.id];
		const value = state.compiler.memoryBuffer[address];

		engine.setSpriteLookup(font('white'));
		engine.drawText(
			stepper.x + VGRID * 4,
			stepper.y,
			(stepper.label || stepper.id) + ': ' + (stepper.textValue || value)
		);
	}
}
