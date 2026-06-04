import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { Icon } from '@8f4e/sprite-generator';
import type { Engine } from 'glugglug';
import type { MemoryViews } from '../../../types';

export default function drawButtons(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups) {
		return;
	}

	for (const { x, y, wordAlignedAddress, onValue, offValue } of codeBlock.widgets.buttons) {
		const value = memoryViews.int32[wordAlignedAddress] || 0;

		if (value === onValue) {
			engine.setSpriteLookup(state.spriteLookups.icons);
			engine.drawSprite(x, y, Icon.SWITCH_ON);
		} else if (value === offValue) {
			engine.setSpriteLookup(state.spriteLookups.icons);
			engine.drawSprite(x, y, Icon.SWITCH_OFF);
		} else {
			engine.setSpriteLookup(state.spriteLookups.fontNumbers);
			engine.drawText(x, y, '[__]');
		}
	}
}
