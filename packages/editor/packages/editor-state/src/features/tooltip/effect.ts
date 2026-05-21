import {
	ArgumentType,
	BASE_TYPE_METADATA,
	getInstructionSpec,
	getInstructionStackSignature,
	memoryDeclarationInstructions,
	type AST,
	type CompiledStackAnalysisLine,
	type DataStructure,
	type InstructionSpec,
	type Stack,
	type StackItem,
} from '@8f4e/compiler-spec';

import wrapText from '../code-blocks/utils/wrapText';

import type { CodeBlockGraphicData, State, TooltipLiveValue, TooltipLiveValueSource } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { SpriteLookup } from 'glugglug';

export const TOOLTIP_WRAP_WIDTH = 32;

const stackBeforeLabel = 'before ';
const stackAfterLabel = 'after: ';
const memoryIdentifierRegExp = /^[a-z_]\w*$/i;
const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);
const maxLiveMemoryAddressLength = 10;
const maxLiveMemoryValueLength = 11;

type SpriteLookups = NonNullable<State['graphicHelper']['spriteLookups']>;

interface TooltipHighlightRange {
	start: number;
	end: number;
}

interface SelectedLineTooltipContent {
	text: string[];
	characters: Array<Array<number | string>>;
	colors: Array<Array<SpriteLookup | undefined>>;
	lineCount: number;
	widthChars: number;
	liveValues: TooltipLiveValue[];
}

interface LiveTooltipLine {
	label: string;
	maxLineLength: number;
	source: TooltipLiveValueSource;
}

interface LiveTooltipContent {
	text: string[];
	colors: Array<Array<SpriteLookup | undefined>>;
	liveValues: TooltipLiveValue[];
	maxLineLength: number;
}

export function wrapTooltipText(text: string, maxLength = TOOLTIP_WRAP_WIDTH): string[] {
	return wrapText(text, maxLength);
}

export function getInstructionNameFromSourceLine(line: string): string | undefined {
	return line.trim().split(/\s+/)[0] || undefined;
}

export function getInstructionSpecFromSourceLine(line: string): InstructionSpec | undefined {
	const instruction = getInstructionNameFromSourceLine(line);

	if (!instruction || instruction.startsWith(';')) {
		return undefined;
	}

	return getInstructionSpec(instruction);
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

function isPointerMemory(memory: DataStructure): boolean {
	return Boolean(memory.pointeeBaseType || memory.isPointingToPointer);
}

function getDereferencedMemoryFormat(memory: DataStructure) {
	const pointeeType = memory.isPointingToPointer ? 'pointer' : memory.pointeeBaseType!;
	const metadata = BASE_TYPE_METADATA[pointeeType];

	return {
		elementWordSize: metadata.wordSize,
		isInteger: metadata.isInteger,
		isUnsigned: pointeeType === 'int8u' || pointeeType === 'int16u',
	};
}

function getTextCharacters(text: string): Array<number | string> {
	return [...text].map(char => char.charCodeAt(0));
}

function getTooltipTextCharacters(text: string[]): Array<Array<number | string>> {
	return text.map(getTextCharacters);
}

function getMaxLineLength(lines: string[]): number {
	let maxLineLength = 0;

	for (let index = 0; index < lines.length; index++) {
		maxLineLength = Math.max(maxLineLength, lines[index].length);
	}

	return maxLineLength;
}

function getStackSignatureLineFromSourceLine(line: string, instruction: string): AST[number] | undefined {
	if (instruction !== 'storeBytes') {
		return undefined;
	}

	const count = Number.parseInt(line.trim().split(/\s+/)[1] ?? '', 10);

	if (!Number.isFinite(count)) {
		return undefined;
	}

	return {
		lineNumberBeforeMacroExpansion: 0,
		lineNumberAfterMacroExpansion: 0,
		instruction: 'storeBytes',
		arguments: [{ type: ArgumentType.LITERAL, value: count, isInteger: true }],
	};
}

export function getStackSignatureFromSourceLine(line: string): string | undefined {
	const instruction = getInstructionNameFromSourceLine(line);
	const spec = getInstructionSpecFromSourceLine(line);

	if (!instruction || !spec) {
		return undefined;
	}

	return getInstructionStackSignature(instruction, getStackSignatureLineFromSourceLine(line, instruction));
}

function getStackValueHighlightRange(line: string): TooltipHighlightRange | undefined {
	if (line.startsWith(stackBeforeLabel)) {
		return { start: stackBeforeLabel.length, end: line.length };
	}

	if (line.startsWith(stackAfterLabel)) {
		return { start: stackAfterLabel.length, end: line.length };
	}

	return undefined;
}

function getTooltipLineColors(
	line: string,
	spriteLookups: SpriteLookups | undefined,
	highlightRanges: TooltipHighlightRange[] = []
): Array<SpriteLookup | undefined> {
	if (!spriteLookups || line.length === 0) {
		return [];
	}

	const colors: Array<SpriteLookup | undefined> = new Array(line.length).fill(undefined);
	colors[0] = spriteLookups.fontTooltipText;

	for (const range of highlightRanges) {
		colors[range.start] = spriteLookups.fontTooltipHighlight;

		if (range.end < line.length) {
			colors[range.end] = spriteLookups.fontTooltipText;
		}
	}

	return colors;
}

function getStackItemLabel(item: StackItem): string {
	let label: string;

	if (item.address || item.pointeeBaseType || item.isPointingToPointer) {
		label = 'ptr';
	} else if (item.isFloat64) {
		label = 'float64';
	} else {
		label = item.isInteger ? 'int' : 'float';
	}

	return item.knownIntegerValue === undefined ? label : `${label}=${item.knownIntegerValue}`;
}

function formatStack(stack: Stack): string {
	return `[${stack.map(getStackItemLabel).join(', ')}]`;
}

export function getStackAnalysisTooltipText(stackAnalysisLine: CompiledStackAnalysisLine | undefined): string[] {
	if (!stackAnalysisLine) {
		return [];
	}

	const { stackBefore, stackAfter } = stackAnalysisLine.stackAnalysis;

	return [`before ${formatStack(stackBefore)}`, `after: ${formatStack(stackAfter)}`];
}

function getSelectedCodeBlockStackAnalysisLine(state: State, selectedCodeBlock: CodeBlockGraphicData) {
	const moduleId = selectedCodeBlock.moduleId;

	if (!moduleId) {
		return undefined;
	}

	return state.compiler.compiledModules[moduleId]?.stackAnalysis?.find(
		line => line.lineNumberBeforeMacroExpansion === selectedCodeBlock.cursor.row
	);
}

function getSelectedMemoryDeclaration(state: State, moduleId: string | undefined, memoryId: string | undefined) {
	if (!moduleId || !memoryId) {
		return undefined;
	}

	return state.compiler.compiledModules[moduleId]?.memoryMap[memoryId];
}

function getLiveTooltipContent(
	memory: DataStructure | undefined,
	moduleId: string | undefined,
	memoryId: string | undefined,
	firstLineIndex: number,
	spriteLookups: SpriteLookups | undefined
): LiveTooltipContent {
	if (!memory || !moduleId || !memoryId) {
		return { text: [], colors: [], liveValues: [], maxLineLength: 0 };
	}

	const valueColor = spriteLookups?.fontTooltipHighlight;
	const valueLabel = memory.numberOfElements > 1 ? 'value[0]: ' : 'value: ';
	const lines: LiveTooltipLine[] = [
		{
			label: 'address: ',
			maxLineLength: 'address: '.length + maxLiveMemoryAddressLength,
			source: { kind: 'memoryAddress', moduleId, memoryId },
		},
		{
			label: valueLabel,
			maxLineLength: valueLabel.length + maxLiveMemoryValueLength,
			source: { kind: 'memoryValue', moduleId, memoryId, elementIndex: 0 },
		},
	];

	if (isPointerMemory(memory)) {
		lines.push({
			label: 'deref: ',
			maxLineLength: 'deref: '.length + maxLiveMemoryValueLength,
			source: { kind: 'memoryDereference', moduleId, memoryId, format: getDereferencedMemoryFormat(memory) },
		});
	}

	return {
		text: lines.map(liveLine => liveLine.label),
		colors: lines.map(liveLine => getTooltipLineColors(liveLine.label, spriteLookups)),
		liveValues: lines.map((liveLine, index) => ({
			lineIndex: firstLineIndex + index,
			column: liveLine.label.length,
			source: liveLine.source,
			color: valueColor,
		})),
		maxLineLength: Math.max(...lines.map(line => line.maxLineLength)),
	};
}

export function getSelectedLineTooltipText(
	line: string | undefined,
	maxLength = TOOLTIP_WRAP_WIDTH,
	stackAnalysisLine?: CompiledStackAnalysisLine
): string[] {
	if (!line) {
		return [];
	}

	const spec = getInstructionSpecFromSourceLine(line);
	const stackSignature = getStackSignatureFromSourceLine(line);
	const shortDescription = spec?.docs?.shortDescription;
	const tooltipText: string[] = [];

	if (stackSignature) {
		tooltipText.push(stackSignature);
	}

	if (shortDescription) {
		tooltipText.push(...wrapTooltipText(shortDescription, maxLength));
	}

	tooltipText.push(...getStackAnalysisTooltipText(stackAnalysisLine));

	if (tooltipText.length === 0) {
		return [];
	}

	return tooltipText;
}

export function getSelectedLineTooltipColors(
	line: string | undefined,
	text: string[],
	spriteLookups: SpriteLookups | undefined
): Array<Array<SpriteLookup | undefined>> {
	const stackSignature = line ? getStackSignatureFromSourceLine(line) : undefined;

	return text.map((tooltipLine, index) => {
		const highlightRange =
			index === 0 && stackSignature === tooltipLine
				? { start: 0, end: tooltipLine.length }
				: getStackValueHighlightRange(tooltipLine);

		return getTooltipLineColors(tooltipLine, spriteLookups, highlightRange ? [highlightRange] : []);
	});
}

export function getSelectedLineTooltipContent(
	line: string | undefined,
	maxLength = TOOLTIP_WRAP_WIDTH,
	stackAnalysisLine?: CompiledStackAnalysisLine,
	spriteLookups?: SpriteLookups,
	moduleId?: string,
	memory?: DataStructure
): SelectedLineTooltipContent {
	const text = getSelectedLineTooltipText(line, maxLength, stackAnalysisLine);
	const memoryId = getMemoryDeclarationIdFromSourceLine(line);
	const colors = getSelectedLineTooltipColors(line, text, spriteLookups);
	const liveTooltipContent = getLiveTooltipContent(memory, moduleId, memoryId, text.length, spriteLookups);

	text.push(...liveTooltipContent.text);
	colors.push(...liveTooltipContent.colors);

	return {
		text,
		characters: getTooltipTextCharacters(text),
		colors,
		lineCount: text.length,
		widthChars: Math.max(getMaxLineLength(text), liveTooltipContent.maxLineLength),
		liveValues: liveTooltipContent.liveValues,
	};
}

export default function tooltip(store: StateManager<State>): void {
	const state = store.getState();

	function syncSelectedLineTooltip(): void {
		const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;

		if (!state.featureFlags.codeLineSelection || !selectedCodeBlock) {
			store.set('tooltip.text', []);
			store.set('tooltip.characters', []);
			store.set('tooltip.colors', []);
			store.set('tooltip.lineCount', 0);
			store.set('tooltip.widthChars', 0);
			store.set('tooltip.liveValues', []);
			return;
		}

		const line = selectedCodeBlock.code[selectedCodeBlock.cursor.row];
		const memoryId = getMemoryDeclarationIdFromSourceLine(line);
		const content = getSelectedLineTooltipContent(
			line,
			TOOLTIP_WRAP_WIDTH,
			getSelectedCodeBlockStackAnalysisLine(state, selectedCodeBlock),
			state.graphicHelper.spriteLookups,
			selectedCodeBlock.moduleId,
			getSelectedMemoryDeclaration(state, selectedCodeBlock.moduleId, memoryId)
		);

		store.set('tooltip.text', content.text);
		store.set('tooltip.characters', content.characters);
		store.set('tooltip.colors', content.colors);
		store.set('tooltip.lineCount', content.lineCount);
		store.set('tooltip.widthChars', content.widthChars);
		store.set('tooltip.liveValues', content.liveValues);
	}

	store.subscribe('graphicHelper.selectedCodeBlock', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor.row', syncSelectedLineTooltip);
	store.subscribe('featureFlags.codeLineSelection', syncSelectedLineTooltip);
	store.subscribe('compiler.compiledModules', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.spriteLookups', syncSelectedLineTooltip);

	syncSelectedLineTooltip();
}
