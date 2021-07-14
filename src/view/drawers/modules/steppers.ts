import { Engine } from '2d-engine';
import { State, Stepper } from '../../../state/types';
import { font } from 'sprite-generator';

export default function drawSteppers(
	engine: Engine,
	steppers: Stepper[],
	state: State,
	id: string,
	vGrid: number,
	hGrid: number
): void {
	for (let i = 0; i < steppers.length; i++) {
		const stepper = steppers[i];

		engine.setSpriteLookup(font('icons_white'));
		engine.drawText(stepper.x, stepper.y, '$%');
		engine.drawText(stepper.x + vGrid * 2, stepper.y, '$%');

		//engine.setSpriteLookup(fillColor);
		//engine.drawRectangle(stepper.x, stepper.y, vGrid, hGrid, 'rgb(255,255,255)');

		const address = state.compiler.memoryAddressLookup[id][stepper.id];
		const value = state.compiler.memoryBuffer[address];

		engine.setSpriteLookup(font('small_white'));
		engine.drawText(
			stepper.x + vGrid * 4,
			stepper.y,
			(stepper.label || stepper.id) + ': ' + (stepper.textValue || value)
		);
	}
}
