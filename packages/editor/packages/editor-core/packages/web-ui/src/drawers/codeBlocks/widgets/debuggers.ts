import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';
import formatDebuggerValue from './formatDebuggerValue';

function drawBracketedValue(engine: DrawContext, state: State, x: number, y: number, value: string): void {
	engine.drawText(x, y, '[', state.spriteLookups!.fontCode);
	engine.drawText(x + state.viewport.vGrid, y, value, state.spriteLookups!.fontNumbers);
	engine.drawText(x + state.viewport.vGrid * (value.length + 1), y, ']', state.spriteLookups!.fontCode);
}

export default function drawConnectors(
	engine: DrawContext,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups) {
		return;
	}

	if (memoryViews.int32.length === 0) {
		return;
	}

	for (const { x, y, memory, showAddress, showEndAddress, displayFormat, bufferPointer, text } of codeBlock.widgets
		.debuggers) {
		if (text !== undefined) {
			drawBracketedValue(engine, state, x, y, text);
			continue;
		}

		if (!memory) {
			continue;
		}

		if (showAddress) {
			drawBracketedValue(engine, state, x, y, String(memory.byteAddress + bufferPointer * 4));
		} else if (showEndAddress) {
			drawBracketedValue(engine, state, x, y, String((memory.wordAlignedSize - 1) * 4 + memory.byteAddress));
		} else {
			const value = formatDebuggerValue(memoryViews, memory, bufferPointer, displayFormat);
			drawBracketedValue(engine, state, x, y, value);
		}
	}
}
