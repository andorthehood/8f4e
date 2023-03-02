import { Engine } from '@8f4e/2d-engine';
import { font } from '@8f4e/sprite-generator';

import { Module, State } from '../../../state/types';

export default function drawSwitches(engine: Engine, state: State, module: Module): void {
	const graphicData = state.graphicHelper.modules.get(module);

	if (!graphicData) {
		return;
	}

	for (const [, { x, y, id: debuggerId, onValue, offValue }] of graphicData.switches) {
		const memory = state.compiler.compiledModules.get(graphicData.id)?.memoryMap.get(debuggerId);

		if (!memory) {
			return;
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
