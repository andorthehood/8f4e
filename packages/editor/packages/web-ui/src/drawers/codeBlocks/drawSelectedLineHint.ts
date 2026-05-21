import { BASE_TYPE_METADATA } from '@8f4e/compiler-spec';

import formatDebuggerValue from './widgets/formatDebuggerValue';

import type { Engine } from 'glugglug';
import type { DataStructure, MemoryType } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../types';
import type { SpriteLookup } from 'glugglug';

const horizontalPaddingChars = 1;

interface TooltipContent {
	text: string[];
	colors: Array<Array<SpriteLookup | undefined>>;
}

function isPointerMemory(memory: DataStructure): boolean {
	return Boolean(memory.pointeeBaseType || memory.isPointingToPointer);
}

function createDereferencedMemory(memory: DataStructure, byteAddress: number): DataStructure {
	const pointeeType = memory.isPointingToPointer ? 'pointer' : memory.pointeeBaseType!;
	const metadata = BASE_TYPE_METADATA[pointeeType];
	const baseMemory = { ...memory };

	delete baseMemory.pointeeBaseType;
	delete baseMemory.pointeeMemoryIndex;
	delete baseMemory.pointeeMemoryRegionName;

	return {
		...baseMemory,
		id: `${memory.id}*`,
		numberOfElements: 1,
		elementWordSize: metadata.wordSize,
		wordAlignedSize: Math.ceil(metadata.wordSize / 4),
		wordAlignedAddress: byteAddress / 4,
		byteAddress,
		default: 0,
		isInteger: metadata.isInteger,
		isFloat64: metadata.valueKind === 'float64',
		isPointingToPointer: false,
		isUnsigned: pointeeType === 'int8u' || pointeeType === 'int16u',
		type: 'int' as MemoryType,
	};
}

function getValueHighlightColors(
	line: string,
	spriteLookups: NonNullable<State['graphicHelper']['spriteLookups']>
): Array<SpriteLookup | undefined> {
	const colors: Array<SpriteLookup | undefined> = new Array(line.length).fill(undefined);
	const valueStart = line.indexOf(': ') + 2;

	colors[0] = spriteLookups.fontTooltipText;

	if (valueStart > 1 && valueStart < line.length) {
		colors[valueStart] = spriteLookups.fontTooltipHighlight;
	}

	return colors;
}

export function getMemoryDeclarationTooltipContent(
	memoryViews: MemoryViews,
	memory: DataStructure | undefined,
	spriteLookups: NonNullable<State['graphicHelper']['spriteLookups']>
): TooltipContent {
	if (!memory) {
		return { text: [], colors: [] };
	}

	const valueLabel = memory.numberOfElements > 1 ? 'value[0]' : 'value';
	const text = [
		`address: ${memory.byteAddress}`,
		`${valueLabel}: ${formatDebuggerValue(memoryViews, memory, 0, 'decimal')}`,
	];

	if (isPointerMemory(memory)) {
		const pointerByteAddress = memoryViews.int32[memory.wordAlignedAddress];
		const dereferencedMemory = createDereferencedMemory(memory, pointerByteAddress);

		text.push(`deref: ${formatDebuggerValue(memoryViews, dereferencedMemory, 0, 'decimal')}`);
	}

	return {
		text,
		colors: text.map(line => getValueHighlightColors(line, spriteLookups)),
	};
}

function getSelectedMemoryDeclaration(state: State): DataStructure | undefined {
	const target = state.tooltip.memoryValueTarget;

	if (!target) {
		return undefined;
	}

	return state.compiler.compiledModules[target.moduleId]?.memoryMap[target.memoryId];
}

function appendLiveMemoryContent(
	lines: string[],
	colors: Array<Array<SpriteLookup | undefined>>,
	memoryContent: TooltipContent,
	insertAtLineIndex: number
): void {
	lines.splice(insertAtLineIndex, 0, ...memoryContent.text);
	colors.splice(insertAtLineIndex, 0, ...memoryContent.colors);
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

	const lines = [...state.tooltip.text];
	const colors = [...state.tooltip.colors];

	if (state.tooltip.memoryValueTarget) {
		const memoryContent = getMemoryDeclarationTooltipContent(
			memoryViews,
			getSelectedMemoryDeclaration(state),
			spriteLookups
		);

		appendLiveMemoryContent(lines, colors, memoryContent, state.tooltip.memoryValueTarget.insertAtLineIndex);
	}

	if (lines.length === 0) {
		return;
	}

	const { vGrid, hGrid } = state.viewport;
	const horizontalPadding = horizontalPaddingChars * vGrid;
	const width = (Math.max(...lines.map(line => line.length)) + horizontalPaddingChars * 2) * vGrid;
	const height = lines.length * hGrid;
	const x = -width - vGrid;
	const y = codeBlock.cursor.y;

	engine.setSpriteLookup(spriteLookups.fillColors);
	engine.drawSprite(x, y, 'tooltipBackground', width, height);

	lines.forEach((line, index) => {
		const lineX = x + horizontalPadding;
		const lineY = y + index * hGrid;

		drawTextWithColors(engine, state, line, colors[index] ?? [], lineX, lineY);
	});
}
