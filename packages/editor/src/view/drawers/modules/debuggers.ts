import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const [, { x, y, id: debuggerId }] of module.debuggers) {
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(debuggerId);

		if (!memory) {
			continue;
		}

		const value = memory.isInteger
			? state.compiler.memoryBuffer[memory.wordAddress].toString()
			: state.compiler.memoryBufferFloat[memory.wordAddress].toFixed(4);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		engine.drawText(x, y, '[' + value + ']');
	}
}
