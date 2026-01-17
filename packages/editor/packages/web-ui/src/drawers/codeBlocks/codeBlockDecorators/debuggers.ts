import { Engine } from 'glugglug';

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

	for (const { x, y, memory, showAddress, showEndAddress, showBinary, bufferPointer } of codeBlock.extras.debuggers) {
		// TODO: fix this, happens when it's a 16 or 8 bit memory view in 8f4e and the size is not multiple of 4
		// probably need to create separate memory views for those cases
		if (memoryViews.float32[memory.wordAlignedAddress + bufferPointer] === undefined) {
			continue;
		}

		const value = memory.isInteger
			? memoryViews.int32[memory.wordAlignedAddress + bufferPointer].toString(showBinary ? 2 : 10)
			: memoryViews.float32[memory.wordAlignedAddress + bufferPointer].toFixed(4);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

		if (showAddress) {
			engine.drawText(x, y, '[' + (memory.byteAddress + bufferPointer * 4) + ']');
		} else if (showEndAddress) {
			engine.drawText(x, y, '[' + ((memory.wordAlignedSize - 1) * 4 + memory.byteAddress) + ']');
		} else {
			engine.drawText(x, y, '[' + value + ']');
		}
	}
}
