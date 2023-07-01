import { Engine } from '@8f4e/2d-engine';
import { Icon, font, icons } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawSwitches(engine: Engine, state: State, module: ModuleGraphicData): void {
	for (const [, { x, y, id: debuggerId, onValue, offValue }] of module.buttons) {
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(debuggerId);

		if (!memory) {
			continue;
		}

		const { wordAddress } = memory;
		const value = state.compiler.memoryBuffer[wordAddress] || 0;

		if (value === onValue) {
			engine.setSpriteLookup(icons);
			engine.drawSprite(x, y, Icon.SWITCH_ON);
		} else if (value === offValue) {
			engine.setSpriteLookup(icons);
			engine.drawSprite(x, y, Icon.SWITCH_OFF);
		} else {
			engine.setSpriteLookup(font('numbers'));
			engine.drawText(x, y, '[__]');
		}
	}
}
