import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';
import drawBinaryControl from './drawBinaryControl';

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

	for (const _switch of codeBlock.widgets.switches) {
		const value = memoryViews.int32[_switch.allocationUnitAddress] || 0;

		if (value === _switch.onValue) {
			drawBinaryControl(engine, state, _switch, true);
		} else if (value === _switch.offValue) {
			drawBinaryControl(engine, state, _switch, false);
		} else {
			engine.drawText(_switch.x, _switch.y, UNRESOLVED_SWITCH_VALUE_LABEL, state.spriteLookups.fontNumbers);
		}
	}
}
