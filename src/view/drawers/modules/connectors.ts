import { Engine } from '@8f4e/2d-engine';
import { feedbackScale, fillColor, font } from '@8f4e/sprite-generator';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawConnectors(engine: Engine, state: State, id: string, code: string[]): void {
	if (!state.compiler.compiledModules.has(id)) {
		return;
	}

	for (let i = 0; i < state.compiler.compiledModules.get(id).outputs.length; i++) {
		const connectorAddress = state.compiler.compiledModules.get(id).outputs[i].byteAddress / 4;
		const lineNumber = state.compiler.compiledModules.get(id).outputs[i].lineNumber;
		const value = state.compiler.memoryBuffer[connectorAddress];
		engine.setSpriteLookup(feedbackScale);
		engine.drawSprite(VGRID * 3 + VGRID * code[lineNumber - 1].length, HGRID * lineNumber, value, VGRID * 2, HGRID);
		engine.setSpriteLookup(font('white'));
		engine.drawText(VGRID * 6 + VGRID * code[lineNumber - 1].length, HGRID * lineNumber, value.toString());
	}

	for (let i = 0; i < state.compiler.compiledModules.get(id).inputs.length; i++) {
		const lineNumber = state.compiler.compiledModules.get(id).inputs[i].lineNumber;
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(0, HGRID * lineNumber, 2 * VGRID, HGRID, 'rgb(153,153,153)');
	}
}
