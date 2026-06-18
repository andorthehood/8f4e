import type { CodeBlockGraphicData, State, TooltipLiveValue } from '@8f4e/editor-state-types';
import type { PlannedMemoryDeclaration } from '@8f4e/language-spec';
import type { Engine, SpriteLookup } from 'glugglug';
import type { MemoryViews } from '../../types';
import formatDebuggerValue, { formatDebuggerValueAtAddress } from './widgets/formatDebuggerValue';

function getMemoryForLiveValueLine(
	state: State,
	moduleId: string,
	memoryId: string
): PlannedMemoryDeclaration | undefined {
	return state.compiler.memoryPlan.modules[moduleId]?.memory[memoryId];
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
	colors: Array<SpriteLookup | undefined> | undefined,
	x: number,
	y: number
): void {
	const spriteLookups = state.spriteLookups!;
	let currentLookup = colors?.[0] ?? spriteLookups.fontTooltipText;

	engine.setSpriteLookup(currentLookup);

	for (let index = 0; index < characters.length; index++) {
		const nextLookup = colors?.[index] ?? currentLookup;

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

function drawLiveValue(engine: Engine, state: State, memoryViews: MemoryViews, liveValue: TooltipLiveValue): void {
	const spriteLookups = state.spriteLookups!;
	const value = getLiveValueText(state, memoryViews, liveValue);

	if (value === undefined) {
		return;
	}

	engine.setSpriteLookup(liveValue.color ?? spriteLookups.fontTooltipHighlight);
	drawTextCharacters(engine, state, value, liveValue.x, liveValue.y);
}

export default function drawSelectedLineHint(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	const spriteLookups = state.spriteLookups;

	if (
		!spriteLookups ||
		!state.featureFlags.codeLineSelection ||
		state.codeBlockRendering.selectedCodeBlock !== codeBlock
	) {
		return;
	}

	if (state.tooltip.lineCount === 0) {
		return;
	}

	const { width, height, x, y, lineX } = state.tooltip.layout;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'tooltipBackground', width, height);

	for (const highlight of state.tooltip.highlights) {
		engine.drawSprite(highlight.x, highlight.y, highlight.fillColor, highlight.width, highlight.height);
	}

	for (let index = 0; index < state.tooltip.characters.length; index++) {
		drawCharactersWithColors(
			engine,
			state,
			state.tooltip.characters[index],
			state.tooltip.colors[index],
			lineX,
			y + index * state.viewport.hGrid
		);
	}

	for (const liveValue of state.tooltip.liveValues) {
		drawLiveValue(engine, state, memoryViews, liveValue);
	}
}
