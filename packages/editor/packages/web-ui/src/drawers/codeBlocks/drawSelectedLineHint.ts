import formatDebuggerValue from './widgets/formatDebuggerValue';

import type { Engine } from 'glugglug';
import type { DataStructure } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State, TooltipLiveValueMemoryFormat } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../types';
import type { SpriteLookup } from 'glugglug';

const horizontalPaddingChars = 1;

function getMemoryForLiveValueLine(state: State, moduleId: string, memoryId: string): DataStructure | undefined {
	return state.compiler.compiledModules[moduleId]?.memoryMap[memoryId];
}

function formatLiveMemoryValue(
	memoryViews: MemoryViews,
	byteAddress: number,
	wordAlignedAddress: number,
	format: TooltipLiveValueMemoryFormat
): string {
	if (format.elementWordSize === 1 && format.isInteger) {
		const view = format.isUnsigned ? memoryViews.uint8 : memoryViews.int8;
		return view[byteAddress].toString(10);
	}

	if (format.elementWordSize === 2 && format.isInteger) {
		const view = format.isUnsigned ? memoryViews.uint16 : memoryViews.int16;
		return view[byteAddress / 2].toString(10);
	}

	if (format.elementWordSize === 8 && !format.isInteger) {
		return memoryViews.float64[byteAddress / 8].toFixed(4);
	}

	return format.isInteger
		? memoryViews.int32[wordAlignedAddress].toString(10)
		: memoryViews.float32[wordAlignedAddress].toFixed(4);
}

function getLiveValueText(state: State, memoryViews: MemoryViews, liveLineIndex: number): string | undefined {
	const liveLine = state.tooltip.liveValueBlock?.lines[liveLineIndex];

	if (!liveLine) {
		return undefined;
	}

	const memory = getMemoryForLiveValueLine(state, liveLine.source.moduleId, liveLine.source.memoryId);

	if (!memory) {
		return undefined;
	}

	switch (liveLine.source.kind) {
		case 'memoryAddress':
			return String(memory.byteAddress);
		case 'memoryValue':
			return formatDebuggerValue(memoryViews, memory, liveLine.source.elementIndex ?? 0, 'decimal');
		case 'memoryDereference': {
			const pointerByteAddress = memoryViews.int32[memory.wordAlignedAddress];
			return formatLiveMemoryValue(memoryViews, pointerByteAddress, pointerByteAddress / 4, liveLine.source.format);
		}
	}
}

function getLiveValueTexts(state: State, memoryViews: MemoryViews): Array<string | undefined> {
	const block = state.tooltip.liveValueBlock;

	if (!block) {
		return [];
	}

	const liveValueTexts: Array<string | undefined> = new Array(block.lines.length);

	for (let index = 0; index < block.lines.length; index++) {
		const value = getLiveValueText(state, memoryViews, index);

		liveValueTexts[index] = value === undefined ? undefined : `${block.lines[index].label}${value}`;
	}

	return liveValueTexts;
}

function getLiveValueLineCount(liveValueTexts: Array<string | undefined>): number {
	let count = 0;

	for (let index = 0; index < liveValueTexts.length; index++) {
		if (liveValueTexts[index] !== undefined) {
			count++;
		}
	}

	return count;
}

function getMaxLiveValueLineLength(liveValueTexts: Array<string | undefined>): number {
	let maxLineLength = 0;

	for (let index = 0; index < liveValueTexts.length; index++) {
		maxLineLength = Math.max(maxLineLength, liveValueTexts[index]?.length ?? 0);
	}

	return maxLineLength;
}

function drawTextWithColors(
	engine: Engine,
	state: State,
	text: string,
	colors: Array<SpriteLookup | undefined>,
	x: number,
	y: number
): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	let segmentStart = 0;
	let currentLookup = colors[0] ?? spriteLookups.fontTooltipText;

	engine.setSpriteLookup(currentLookup);

	for (let index = 1; index < text.length; index++) {
		const nextLookup = colors[index];

		if (!nextLookup || nextLookup === currentLookup) {
			continue;
		}

		engine.drawText(x + segmentStart * state.viewport.vGrid, y, text.slice(segmentStart, index));
		engine.setSpriteLookup(nextLookup);
		currentLookup = nextLookup;
		segmentStart = index;
	}

	if (segmentStart < text.length) {
		engine.drawText(x + segmentStart * state.viewport.vGrid, y, text.slice(segmentStart));
	}
}

function drawLiveValueLine(
	engine: Engine,
	state: State,
	text: string,
	liveLineIndex: number,
	x: number,
	y: number
): void {
	const liveLine = state.tooltip.liveValueBlock!.lines[liveLineIndex];
	const spriteLookups = state.graphicHelper.spriteLookups!;
	const value = text.slice(liveLine.label.length);

	engine.setSpriteLookup(liveLine.textColor ?? spriteLookups.fontTooltipText);
	engine.drawText(x, y, liveLine.label);
	engine.setSpriteLookup(liveLine.valueColor ?? spriteLookups.fontTooltipHighlight);
	engine.drawText(x + liveLine.label.length * state.viewport.vGrid, y, value);
}

function drawLiveValueLines(
	engine: Engine,
	state: State,
	liveValueTexts: Array<string | undefined>,
	lineX: number,
	y: number,
	renderedLineIndex: number
): number {
	let nextRenderedLineIndex = renderedLineIndex;

	for (let index = 0; index < liveValueTexts.length; index++) {
		const text = liveValueTexts[index];

		if (text === undefined) {
			continue;
		}

		drawLiveValueLine(engine, state, text, index, lineX, y + nextRenderedLineIndex * state.viewport.hGrid);
		nextRenderedLineIndex++;
	}

	return nextRenderedLineIndex;
}

export default function drawSelectedLineHint(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	const spriteLookups = state.graphicHelper.spriteLookups;

	if (!spriteLookups || !state.featureFlags.codeLineSelection || state.graphicHelper.selectedCodeBlock !== codeBlock) {
		return;
	}

	const liveValueTexts = getLiveValueTexts(state, memoryViews);
	const lineCount = state.tooltip.text.length + getLiveValueLineCount(liveValueTexts);

	if (lineCount === 0) {
		return;
	}

	const { vGrid, hGrid } = state.viewport;
	const horizontalPadding = horizontalPaddingChars * vGrid;
	let maxLineLength = getMaxLiveValueLineLength(liveValueTexts);

	for (let index = 0; index < state.tooltip.text.length; index++) {
		maxLineLength = Math.max(maxLineLength, state.tooltip.text[index].length);
	}

	const width = (maxLineLength + horizontalPaddingChars * 2) * vGrid;
	const height = lineCount * hGrid;
	const x = -width - vGrid;
	const y = codeBlock.cursor.y;
	const lineX = x + horizontalPadding;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'tooltipBackground', width, height);

	let renderedLineIndex = 0;

	for (let index = 0; index <= state.tooltip.text.length; index++) {
		if (state.tooltip.liveValueBlock?.insertAtLineIndex === index) {
			renderedLineIndex = drawLiveValueLines(engine, state, liveValueTexts, lineX, y, renderedLineIndex);
		}

		if (index < state.tooltip.text.length) {
			drawTextWithColors(
				engine,
				state,
				state.tooltip.text[index],
				state.tooltip.colors[index] ?? [],
				lineX,
				y + renderedLineIndex * hGrid
			);
			renderedLineIndex++;
		}
	}
}
