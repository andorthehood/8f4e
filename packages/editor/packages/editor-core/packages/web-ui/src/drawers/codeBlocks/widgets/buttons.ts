import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { Icon } from '@8f4e/sprite-generator';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';

export default function drawButtons(
	engine: DrawContext,
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
			engine.drawSprite(x, y, state.spriteLookups.icons[Icon.SWITCH_ON]);
		} else if (value === offValue) {
			engine.drawSprite(x, y, state.spriteLookups.icons[Icon.SWITCH_OFF]);
		} else {
			engine.drawText(x, y, '[__]', state.spriteLookups.fontNumbers);
		}
	}
}
