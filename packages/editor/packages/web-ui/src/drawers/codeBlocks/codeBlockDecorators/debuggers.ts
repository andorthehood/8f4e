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
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);

		if (showAddress) {
			engine.drawText(x, y, '[' + (memory.byteAddress + bufferPointer * 4) + ']');
		} else if (showEndAddress) {
			engine.drawText(x, y, '[' + ((memory.wordAlignedSize - 1) * 4 + memory.byteAddress) + ']');
		} else {
			let value = '';
			if (memory.elementWordSize === 1 && memory.isInteger) {
				const view = memory.isUnsigned ? memoryViews.uint8 : memoryViews.int8;
				value = view[memory.byteAddress + bufferPointer].toString(showBinary ? 2 : 10);
			} else if (memory.elementWordSize === 2 && memory.isInteger) {
				const view = memory.isUnsigned ? memoryViews.uint16 : memoryViews.int16;
				value = view[memory.byteAddress / 2 + bufferPointer].toString(showBinary ? 2 : 10);
			} else {
				value = memory.isInteger
					? memoryViews.int32[memory.wordAlignedAddress + bufferPointer].toString(showBinary ? 2 : 10)
					: memoryViews.float32[memory.wordAlignedAddress + bufferPointer].toFixed(4);
			}

			engine.drawText(x, y, '[' + value + ']');
		}
	}
}
