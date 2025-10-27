import { Engine } from 'glugglug';
import { Icon } from '@8f4e/sprite-generator';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';

export default function drawButtons(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	for (const [, { x, y, id: debuggerId, onValue, offValue }] of codeBlock.extras.buttons) {
		if (!state.graphicHelper.spriteLookups) {
			continue;
		}

		const memory = state.compiler.compiledModules[codeBlock.id]?.memoryMap[debuggerId];
		const { wordAlignedAddress = 0 } = memory || {};
		const value = state.compiler.memoryBuffer[wordAlignedAddress] || 0;

		if (value === onValue) {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);
			engine.drawSprite(x, y, Icon.SWITCH_ON);
		} else if (value === offValue) {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.icons);
			engine.drawSprite(x, y, Icon.SWITCH_OFF);
		} else {
			engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontNumbers);
			engine.drawText(x, y, '[__]');
		}
	}
}
