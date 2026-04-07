import { Engine } from 'glugglug';

import formatDebuggerValue from './formatDebuggerValue';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

export default function drawConnectors(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	if (memoryViews.int32.length === 0) {
		return;
	}

	for (const { x, y, memory, showAddress, showEndAddress, displayFormat, bufferPointer, text } of codeBlock.widgets
		.debuggers) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

		if (text !== undefined) {
			engine.drawText(x, y, '[' + text + ']');
			continue;
		}

		if (!memory) {
			continue;
		}

		if (showAddress) {
			engine.drawText(x, y, '[' + (memory.byteAddress + bufferPointer * 4) + ']');
		} else if (showEndAddress) {
			engine.drawText(x, y, '[' + ((memory.wordAlignedSize - 1) * 4 + memory.byteAddress) + ']');
		} else {
			const value = formatDebuggerValue(memoryViews, memory, bufferPointer, displayFormat);
			engine.drawText(x, y, '[' + value + ']');
		}
	}
}
