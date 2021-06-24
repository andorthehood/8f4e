import { Engine } from '2d-engine';
import { State, Stepper } from '../../../state/types';
import { font, fillColor } from 'sprite-generator';

export default function drawSteppers(engine: Engine, steppers: Stepper[], state: State, id: string): void {
	for (let i = 0; i < steppers.length; i++) {
		const stepper = steppers[i];
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(stepper.x, stepper.y, stepper.width, stepper.height / 2, 'rgb(255,255,255)');
		engine.drawRectangle(
			stepper.x,
			stepper.y + stepper.height / 2,
			stepper.width,
			stepper.height / 2,
			'rgb(255,255,255)'
		);

		const address =
			state.compiler.memoryAddressLookup[id + '_' + stepper.id] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
		const value = state.compiler.memoryBuffer[address];

		engine.setSpriteLookup(font('small_white'));
		engine.drawText(stepper.x + 12, stepper.y, '' + value);
	}
}
