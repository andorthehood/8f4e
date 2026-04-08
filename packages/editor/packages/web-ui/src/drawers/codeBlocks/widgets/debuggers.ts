import { Engine } from 'glugglug';

import formatDebuggerValue from './formatDebuggerValue';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

function drawBracketedValue(engine: Engine, state: State, x: number, y: number, value: string): void {
	engine.setSpriteLookup(state.graphicHelper.spriteLookups!.fontCode);
	engine.drawText(x, y, '[');
	engine.setSpriteLookup(state.graphicHelper.spriteLookups!.fontNumbers);
	engine.drawText(x + state.viewport.vGrid, y, value);
	engine.setSpriteLookup(state.graphicHelper.spriteLookups!.fontCode);
	engine.drawText(x + state.viewport.vGrid * (value.length + 1), y, ']');
}

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
