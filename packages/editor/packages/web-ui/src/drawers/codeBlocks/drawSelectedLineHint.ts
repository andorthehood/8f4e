import formatDebuggerValue, { formatDebuggerValueAtAddress } from './widgets/formatDebuggerValue';

import type { Engine } from 'glugglug';
import type { DataStructure } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State, TooltipLiveValue } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../types';
import type { SpriteLookup } from 'glugglug';

const horizontalPaddingChars = 1;

function getMemoryForLiveValueLine(state: State, moduleId: string, memoryId: string): DataStructure | undefined {
	return state.compiler.compiledModules[moduleId]?.memoryMap[memoryId];
}

function getLiveValueText(state: State, memoryViews: MemoryViews, liveValue: TooltipLiveValue): string | undefined {
	const memory = getMemoryForLiveValueLine(state, liveValue.source.moduleId, liveValue.source.memoryId);

	if (!memory) {
		return undefined;
	}

	switch (liveValue.source.kind) {
		case 'memoryAddress':
			return String(memory.byteAddress);
		case 'memoryValue':
			return formatDebuggerValue(memoryViews, memory, liveValue.source.elementIndex ?? 0, 'decimal');
		case 'memoryDereference': {
			const pointerByteAddress = memoryViews.int32[memory.wordAlignedAddress];
			return formatDebuggerValueAtAddress(
				memoryViews,
				pointerByteAddress,
				pointerByteAddress / 4,
				liveValue.source.format,
				'decimal'
			);
		}
	}
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

function drawLiveValue(
	engine: Engine,
	state: State,
	memoryViews: MemoryViews,
	liveValue: TooltipLiveValue,
	x: number,
	y: number
): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	const value = getLiveValueText(state, memoryViews, liveValue);

	if (value === undefined) {
		return;
	}

	engine.setSpriteLookup(liveValue.color ?? spriteLookups.fontTooltipHighlight);
	drawTextCharacters(
		engine,
		state,
		value,
		x + liveValue.column * state.viewport.vGrid,
		y + liveValue.lineIndex * state.viewport.hGrid
	);
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

	for (let index = 0; index < state.tooltip.characters.length; index++) {
		drawCharactersWithColors(
			engine,
			state,
			state.tooltip.characters[index],
			state.tooltip.colors[index] ?? [],
			lineX,
			y + index * hGrid
		);
	}

	for (const liveValue of state.tooltip.liveValues) {
		drawLiveValue(engine, state, memoryViews, liveValue, lineX, y);
	}
}
