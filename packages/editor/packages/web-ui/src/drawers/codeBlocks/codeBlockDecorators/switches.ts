import { Engine } from 'glugglug';
import { Icon } from '@8f4e/sprite-generator';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

export default function drawSwitches(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const { x, y, id: debuggerId, onValue, offValue } of codeBlock.extras.switches) {
		const memory = state.compiler.compiledModules[codeBlock.id]?.memoryMap[debuggerId];

		if (!memory) {
			continue;
		}

		const { wordAlignedAddress } = memory;
		const value = memoryViews.int32[wordAlignedAddress] || 0;

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
