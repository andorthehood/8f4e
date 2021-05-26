import { feedbackScale, font, fillColor } from '../../../../packages/sprite-generator/src';
import { ModuleType, State } from '../../../state/types';
import getConnectorDefaultPosition from '../../helpers/getConnectorDefaultPosition';

export default function drawConnectors(engine, moduleType: ModuleType, state: State, id: string) {
	const { vGrid, hGrid } = state.viewport;
	const { width: moduleWidth, outputs, inputs } = moduleType;

	for (let i = 0; i < outputs.length; i++) {
		const connector = outputs[i];

		if (typeof state.compiler.outputAddressLookup[id + '_' + connector.id] !== 'undefined') {
			const connectorAddress = state.compiler.outputAddressLookup[id + '_' + connector.id];
			const value = state.compiler.memoryBuffer[connectorAddress / state.compiler.memoryBuffer.BYTES_PER_ELEMENT];
			const { x, y, width, height } = getConnectorDefaultPosition(i, false, moduleWidth, vGrid, hGrid);

			engine.setSpriteLookup(feedbackScale);
			engine.drawSprite(x, y, value, width, height);

			engine.setSpriteLookup(font('small_white'));

			const label = connector.label || connector.id;
			engine.drawText(x - vGrid * label.length, y, label);
		}
	}

	for (let i = 0; i < inputs.length; i++) {
		const connector = inputs[i];

		if (typeof state.compiler.outputAddressLookup[id + '_' + connector.id] !== 'undefined') {
			const { x, y, width, height } = getConnectorDefaultPosition(i, true, moduleWidth, vGrid, hGrid);

			engine.setSpriteLookup(fillColor);
			engine.drawRectangle(x, y, width, height, 'rgb(153,153,153)');

			engine.setSpriteLookup(font('small_white'));

			engine.drawText(x + vGrid * 2, y, connector.label || connector.id);
		}
	}
}
