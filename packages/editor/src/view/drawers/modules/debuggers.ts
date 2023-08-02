import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const [, { x, y, memory, showAddress, showEndAddress }] of module.debuggers) {
		const value = memory.isInteger
			? state.compiler.memoryBuffer[memory.wordAddress].toString()
			: state.compiler.memoryBufferFloat[memory.wordAddress].toFixed(4);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

		if (showAddress) {
			engine.drawText(x, y, '[' + memory.byteAddress + ']');
		} else if (showEndAddress) {
			engine.drawText(x, y, '[' + ((memory.wordSize - 1) * 4 + memory.byteAddress) + ']');
		} else {
			engine.drawText(x, y, '[' + value + ']');
		}
	}
}
