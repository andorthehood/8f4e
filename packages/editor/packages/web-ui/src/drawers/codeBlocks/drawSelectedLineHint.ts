import { BASE_TYPE_METADATA, memoryDeclarationInstructions } from '@8f4e/compiler-spec';

import formatDebuggerValue from './widgets/formatDebuggerValue';

import type { Engine } from 'glugglug';
import type { DataStructure, MemoryType } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '../../types';
import type { SpriteLookup } from 'glugglug';

const numberRegExp = /(?<![#\w])-?(?:\d+|0b[01]+|0x[\da-f]+)\b/gi;
const memoryIdentifierRegExp = /^[a-z_]\w*$/i;
const horizontalPaddingChars = 2;
const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);

function isStackAnalysisLine(line: string): boolean {
	return line.startsWith('before ') || line.startsWith('after: ');
}

function isMemoryValueLine(line: string): boolean {
	return (
		line.startsWith('address: ') ||
		line.startsWith('value: ') ||
		line.startsWith('value[0]: ') ||
		line.startsWith('deref: ')
	);
}

function isCodeInfoLine(line: string): boolean {
	return isStackAnalysisLine(line) || isMemoryValueLine(line);
}

function isPointerMemory(memory: DataStructure): boolean {
	return Boolean(memory.pointeeBaseType || memory.isPointingToPointer);
}

export function getMemoryDeclarationIdFromSourceLine(line: string | undefined): string | undefined {
	const source = line?.split(';')[0].trim();

	if (!source) {
		return undefined;
	}

	const [instruction, id] = source.split(/\s+/);

	if (!memoryDeclarationInstructionSet.has(instruction) || !id || !memoryIdentifierRegExp.test(id)) {
		return undefined;
	}

	return id;
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

export function getMemoryDeclarationTooltipText(memoryViews: MemoryViews, memory: DataStructure | undefined): string[] {
	if (!memory) {
		return [];
	}

	const valueLabel = memory.numberOfElements > 1 ? 'value[0]' : 'value';
	const lines = [
		`address: ${memory.byteAddress}`,
		`${valueLabel}: ${formatDebuggerValue(memoryViews, memory, 0, 'decimal')}`,
	];

	if (isPointerMemory(memory)) {
		const pointerByteAddress = memoryViews.int32[memory.wordAlignedAddress];
		const dereferencedMemory = createDereferencedMemory(memory, pointerByteAddress);

		lines.push(`deref: ${formatDebuggerValue(memoryViews, dereferencedMemory, 0, 'decimal')}`);
	}

	return lines;
}

function getSelectedMemoryDeclaration(state: State, codeBlock: CodeBlockGraphicData): DataStructure | undefined {
	const moduleId = codeBlock.moduleId;

	if (!moduleId) {
		return undefined;
	}

	const memoryId = getMemoryDeclarationIdFromSourceLine(codeBlock.code[codeBlock.cursor.row]);

	if (!memoryId) {
		return undefined;
	}

	return state.compiler.compiledModules[moduleId]?.memoryMap[memoryId];
}

function drawTextWithNumberFormatting(
	engine: Engine,
	state: State,
	text: string,
	x: number,
	y: number,
	defaultLookup: SpriteLookup
): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	let previousIndex = 0;

	for (const match of text.matchAll(numberRegExp)) {
		if (typeof match.index !== 'number') {
			continue;
		}

		if (match.index > previousIndex) {
			engine.setSpriteLookup(defaultLookup);
			engine.drawText(x + previousIndex * state.viewport.vGrid, y, text.slice(previousIndex, match.index));
		}

		engine.setSpriteLookup(spriteLookups.fontTooltipValue);
		engine.drawText(x + match.index * state.viewport.vGrid, y, match[0]);
		previousIndex = match.index + match[0].length;
	}

	if (previousIndex < text.length) {
		engine.setSpriteLookup(defaultLookup);
		engine.drawText(x + previousIndex * state.viewport.vGrid, y, text.slice(previousIndex));
	}
}

function drawSignatureLine(engine: Engine, state: State, line: string, x: number, y: number): void {
	const spriteLookups = state.graphicHelper.spriteLookups!;
	const instructionMatch = /^(\S+)(.*)$/.exec(line);

	if (!instructionMatch) {
		return;
	}

	const [, instruction, rest] = instructionMatch;

	engine.setSpriteLookup(spriteLookups.fontTooltipInstruction);
	engine.drawText(x, y, instruction);

	if (rest.length === 0) {
		return;
	}

	drawTextWithNumberFormatting(
		engine,
		state,
		rest,
		x + instruction.length * state.viewport.vGrid,
		y,
		spriteLookups.fontTooltipText
	);
}

export default function drawSelectedLineHint(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	const spriteLookups = state.graphicHelper.spriteLookups;
	const memoryLines = getMemoryDeclarationTooltipText(memoryViews, getSelectedMemoryDeclaration(state, codeBlock));
	const lines = [...state.tooltip.text, ...memoryLines];

	if (
		!spriteLookups ||
		lines.length === 0 ||
		!state.featureFlags.codeLineSelection ||
		state.graphicHelper.selectedCodeBlock !== codeBlock
	) {
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

		if (index === 0 && !isCodeInfoLine(line)) {
			drawSignatureLine(engine, state, line, lineX, lineY);
			return;
		}

		drawTextWithNumberFormatting(engine, state, line, lineX, lineY, spriteLookups.fontTooltipText);
	});
}
