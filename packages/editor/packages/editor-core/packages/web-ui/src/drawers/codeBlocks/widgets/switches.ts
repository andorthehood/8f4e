import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { Icon } from '@8f4e/sprite-generator';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';

const UNRESOLVED_SWITCH_VALUE_LABEL = '[__]';

export default function drawSwitches(
	engine: DrawContext,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups) {
		return;
	}

	for (const { x, y, wordAlignedAddress, onValue, offValue } of codeBlock.widgets.switches) {
		const value = memoryViews.int32[wordAlignedAddress] || 0;

		if (value === onValue) {
			engine.drawSprite(x, y, state.spriteLookups.icons[Icon.SWITCH_ON]);
		} else if (value === offValue) {
			engine.drawSprite(x, y, state.spriteLookups.icons[Icon.SWITCH_OFF]);
		} else {
			engine.drawText(x, y, UNRESOLVED_SWITCH_VALUE_LABEL, state.spriteLookups.fontNumbers);
		}
	}
}
