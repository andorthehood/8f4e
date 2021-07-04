import { Engine } from '2d-engine';
import { State, Stepper } from '../../../state/types';
import { font, fillColor } from 'sprite-generator';
import { Icon } from 'sprite-generator/fonts/icons';

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
		engine.drawText(stepper.x, stepper.y, Icon.TRIANGLE_LEFT);
		engine.drawText(stepper.x + vGrid, stepper.y, Icon.TRIANGLE_RIGHT);

		//engine.setSpriteLookup(fillColor);
		//engine.drawRectangle(stepper.x, stepper.y, vGrid, hGrid, 'rgb(255,255,255)');

		const address =
			state.compiler.memoryAddressLookup[id + '_' + stepper.id] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
		const value = state.compiler.memoryBuffer[address];

		engine.setSpriteLookup(font('small_white'));
		engine.drawText(
			stepper.x + vGrid * 2,
			stepper.y,
			(stepper.label || stepper.id) + ': ' + (stepper.textValue || value)
		);
	}
}
