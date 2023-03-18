import { Engine } from '@8f4e/2d-engine';
import { font } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawSwitches(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, id: debuggerId, onValue, offValue }] of module.switches) {
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(debuggerId);

		if (!memory) {
			continue;
		}

		const { wordAddress } = memory;
		const value = state.compiler.memoryBuffer[wordAddress] || 0;

		engine.setSpriteLookup(font('lime'));

		if (value === onValue) {
			engine.drawText(x, y, '[_#]');
		} else if (value === offValue) {
			engine.drawText(x, y, '[#_]');
		} else {
			engine.drawText(x, y, '[__]');
		}
	}
}
