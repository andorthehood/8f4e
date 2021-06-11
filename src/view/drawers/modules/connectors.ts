import { Engine } from '../../../../packages/2d-engine/src';
import { feedbackScale, font, fillColor } from '../../../../packages/sprite-generator/src';
import { ModuleType, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, moduleType: ModuleType, state: State, id: string): void {
	const { vGrid, hGrid } = state.viewport;
	const { outputs, inputs } = moduleType;

	for (let i = 0; i < outputs.length; i++) {
		const connector = outputs[i];

		if (typeof state.compiler.outputAddressLookup[id + '_' + connector.id] !== 'undefined') {
			const connectorAddress = state.compiler.outputAddressLookup[id + '_' + connector.id];
			const value = state.compiler.memoryBuffer[connectorAddress / state.compiler.memoryBuffer.BYTES_PER_ELEMENT];
			const { x, y } = connector;

			engine.setSpriteLookup(feedbackScale);
			engine.drawSprite(x, y, value, vGrid * 2, hGrid);

			engine.setSpriteLookup(font('small_white'));

			const label = connector.label || connector.id;
			engine.drawText(x - vGrid * label.length, y, label);
		}
	}

	for (let i = 0; i < inputs.length; i++) {
		const connector = inputs[i];

		if (typeof state.compiler.outputAddressLookup[id + '_' + connector.id] !== 'undefined') {
			const { x, y } = connector;

			engine.setSpriteLookup(fillColor);
			engine.drawRectangle(x, y, vGrid, hGrid, 'rgb(153,153,153)');

			engine.setSpriteLookup(font('small_white'));

			engine.drawText(x + vGrid * 2, y, connector.label || connector.id);
		}
	}
}
