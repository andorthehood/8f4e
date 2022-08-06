import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, font, fillColor } from 'sprite-generator';
import { ModuleType, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, moduleType: ModuleType, state: State, id: string): void {
	const { vGrid, hGrid } = state.viewport;
	const { outputs, inputs } = moduleType;

	for (let i = 0; i < outputs.length; i++) {
		const connector = outputs[i];

		if (
			state.compiler.memoryAddressLookup[id] &&
			typeof state.compiler.memoryAddressLookup[id][connector.id] !== 'undefined'
		) {
			const connectorAddress = state.compiler.memoryAddressLookup[id][connector.id];
			const value = state.compiler.memoryBuffer[connectorAddress];
			const { x, y, width, height } = connector;

			engine.setSpriteLookup(feedbackScale);
			engine.drawSprite(x, y, value, width, height);

			engine.setSpriteLookup(font('small_white'));

			const label = connector.label || connector.id;
			engine.drawText(x - vGrid * (label.length + 1), y, label);
		}
	}

	for (let i = 0; i < inputs.length; i++) {
		const connector = inputs[i];

		if (
			state.compiler.memoryAddressLookup[id] &&
			typeof state.compiler.memoryAddressLookup[id][connector.id] !== 'undefined'
		) {
			const { x, y } = connector;

			engine.setSpriteLookup(fillColor);
			engine.drawRectangle(x, y, 2 * vGrid, hGrid - 1, 'rgb(153,153,153)');

			engine.setSpriteLookup(font('small_white'));

			engine.drawText(x + vGrid * 3, y, connector.label || connector.id);
		}
	}
}
