import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';

export default function drawConnectors(engine: Engine, state: State, codeBlock: CodeBlockGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	if (state.compiler.memoryBuffer.length === 0) {
		return;
	}

	for (const [, { x, y, memory, showAddress, showEndAddress, showBinary, bufferPointer }] of codeBlock.extras
		.debuggers) {
		const value = memory.isInteger
			? state.compiler.memoryBuffer[memory.wordAlignedAddress + bufferPointer].toString(showBinary ? 2 : 10)
			: state.compiler.memoryBufferFloat[memory.wordAlignedAddress + bufferPointer].toFixed(4);

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
