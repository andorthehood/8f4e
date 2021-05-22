import { feedbackScale, font, fillColor } from '../../../../packages/sprite-generator/src';
import { Module, ModuleType, State } from '../../../state/types';

function drawConnectors(engine, moduleType: ModuleType, state: State, id: string) {
	const { vGrid, hGrid } = state.viewport;
	const { width, outputs, inputs } = moduleType;

	for (let i = 0; i < outputs.length; i++) {
		const connector = outputs[i];

		if (typeof state.compiler.outputAddressLookup[id + '_' + connector.id] !== 'undefined') {
			const connectorAddress = state.compiler.outputAddressLookup[id + '_' + connector.id];
			const value = state.compiler.memoryBuffer[connectorAddress / state.compiler.memoryBuffer.BYTES_PER_ELEMENT];

			engine.setSpriteLookup(feedbackScale);
			engine.drawSprite((width - 3) * vGrid + 2, (i + 1) * hGrid, value, vGrid * 2, hGrid - 4);

			engine.setSpriteLookup(font('small_white'));

			engine.drawText(10 * vGrid, (i + 1) * hGrid, connector.label || connector.id);
		}
	}

	for (let i = 0; i < inputs.length; i++) {
		const connector = inputs[i];

		if (typeof state.compiler.outputAddressLookup[id + '_' + connector.id] !== 'undefined') {
			const connectorAddress = state.compiler.outputAddressLookup[id + '_' + connector.id];
			const value = state.compiler.memoryBuffer[connectorAddress / state.compiler.memoryBuffer.BYTES_PER_ELEMENT];

			engine.setSpriteLookup(fillColor);
			engine.drawRectangle(1 * vGrid, (i + 1) * hGrid, vGrid, hGrid, 'rgb(153,153,153)');

			engine.setSpriteLookup(font('small_white'));

			engine.drawText(1 * vGrid, (i + 1) * hGrid, connector.label || connector.id);
		}
	}
}

export default drawConnectors;
