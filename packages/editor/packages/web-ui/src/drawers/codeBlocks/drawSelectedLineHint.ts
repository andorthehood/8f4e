import formatDebuggerValue, { formatDebuggerValueAtAddress } from './widgets/formatDebuggerValue';

import type { Engine } from 'glugglug';
import type { DataStructure } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../types';
import type { SpriteLookup } from 'glugglug';

const horizontalPaddingChars = 1;

function getMemoryForLiveValueLine(state: State, moduleId: string, memoryId: string): DataStructure | undefined {
	return state.compiler.compiledModules[moduleId]?.memoryMap[memoryId];
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
			return formatDebuggerValueAtAddress(
				memoryViews,
				pointerByteAddress,
				pointerByteAddress / 4,
				liveLine.source.format,
				'decimal'
			);
		}
	}
}

function getLiveValues(state: State, memoryViews: MemoryViews): Array<string | undefined> {
	const block = state.tooltip.liveValueBlock;

	if (!block) {
		return [];
	}

	const liveValues: Array<string | undefined> = new Array(block.lines.length);

	for (let index = 0; index < block.lines.length; index++) {
		liveValues[index] = getLiveValueText(state, memoryViews, index);
	}

	return liveValues;
}

function drawCharactersWithColors(
	engine: Engine,
	state: State,
	characters: Array<number | string>,
	colors: Array<SpriteLookup | undefined>,
	x: number,
	y: number
): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	let currentLookup = colors[0] ?? spriteLookups.fontTooltipText;

	engine.setSpriteLookup(currentLookup);

	for (let index = 0; index < characters.length; index++) {
		const nextLookup = colors[index] ?? currentLookup;

		if (nextLookup !== currentLookup) {
			engine.setSpriteLookup(nextLookup);
			currentLookup = nextLookup;
		}

		if (characters[index] !== 32) {
			engine.drawSprite(x + index * state.viewport.vGrid, y, characters[index]);
		}
	}
}

function drawTextCharacters(engine: Engine, state: State, text: string, x: number, y: number): void {
	for (let index = 0; index < text.length; index++) {
		const character = text.charCodeAt(index);

		if (character !== 32) {
			engine.drawSprite(x + index * state.viewport.vGrid, y, character);
		}
	}
}

function drawLiveValueLine(
	engine: Engine,
	state: State,
	value: string,
	liveLineIndex: number,
	x: number,
	y: number
): void {
	const liveLine = state.tooltip.liveValueBlock!.lines[liveLineIndex];
	const spriteLookups = state.graphicHelper.spriteLookups!;

	drawCharactersWithColors(engine, state, liveLine.labelCharacters, [liveLine.textColor], x, y);
	engine.setSpriteLookup(liveLine.valueColor ?? spriteLookups.fontTooltipHighlight);
	drawTextCharacters(engine, state, value, x + liveLine.labelCharacters.length * state.viewport.vGrid, y);
}

function drawLiveValueLines(
	engine: Engine,
	state: State,
	liveValues: Array<string | undefined>,
	lineX: number,
	y: number,
	renderedLineIndex: number
): number {
	let nextRenderedLineIndex = renderedLineIndex;

	for (let index = 0; index < liveValues.length; index++) {
		const value = liveValues[index];

		if (value === undefined) {
			continue;
		}

		drawLiveValueLine(engine, state, value, index, lineX, y + nextRenderedLineIndex * state.viewport.hGrid);
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

	const liveValues = getLiveValues(state, memoryViews);

	if (state.tooltip.lineCount === 0) {
		return;
	}

	const { vGrid, hGrid } = state.viewport;
	const horizontalPadding = horizontalPaddingChars * vGrid;
	const width = (state.tooltip.widthChars + horizontalPaddingChars * 2) * vGrid;
	const height = state.tooltip.lineCount * hGrid;
	const x = -width - vGrid;
	const y = codeBlock.cursor.y;
	const lineX = x + horizontalPadding;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'tooltipBackground', width, height);

	let renderedLineIndex = 0;

	for (let index = 0; index <= state.tooltip.text.length; index++) {
		if (state.tooltip.liveValueBlock?.insertAtLineIndex === index) {
			renderedLineIndex = drawLiveValueLines(engine, state, liveValues, lineX, y, renderedLineIndex);
		}

		if (index < state.tooltip.text.length) {
			drawCharactersWithColors(
				engine,
				state,
				state.tooltip.characters[index],
				state.tooltip.colors[index] ?? [],
				lineX,
				y + renderedLineIndex * hGrid
			);
			renderedLineIndex++;
		}
	}
}
