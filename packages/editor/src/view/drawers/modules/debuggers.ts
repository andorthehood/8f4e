import { Engine } from '@8f4e/2d-engine';
import { font } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawConnectors(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, id: debuggerId }] of module.debuggers) {
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(debuggerId);

		if (!memory) {
			continue;
		}

		const value = memory.isInteger
			? state.compiler.memoryBuffer[memory.wordAddress].toString()
			: state.compiler.memoryBufferFloat[memory.wordAddress].toFixed(4);

		engine.setSpriteLookup(font('lime'));
		engine.drawText(x, y, '[' + value + ']');
	}
}
