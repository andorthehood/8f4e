import {
	ArgumentType,
	getInstructionSpec,
	getInstructionStackSignature,
	memoryDeclarationInstructions,
	type AST,
	type CompiledStackAnalysisLine,
	type InstructionSpec,
	type Stack,
	type StackItem,
} from '@8f4e/compiler-spec';

import wrapText from '../code-blocks/utils/wrapText';

import type { CodeBlockGraphicData, State, TooltipMemoryValueTarget } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { SpriteLookup } from 'glugglug';

export const TOOLTIP_WRAP_WIDTH = 32;

const stackBeforeLabel = 'before ';
const stackAfterLabel = 'after: ';
const memoryIdentifierRegExp = /^[a-z_]\w*$/i;
const memoryDeclarationInstructionSet = new Set<string>(memoryDeclarationInstructions);

type SpriteLookups = NonNullable<State['graphicHelper']['spriteLookups']>;

interface TooltipHighlightRange {
	start: number;
	end: number;
}

interface SelectedLineTooltipContent {
	text: string[];
	colors: Array<Array<SpriteLookup | undefined>>;
	memoryValueTarget: TooltipMemoryValueTarget | undefined;
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
	moduleId?: string
): SelectedLineTooltipContent {
	const text = getSelectedLineTooltipText(line, maxLength, stackAnalysisLine);
	const memoryId = getMemoryDeclarationIdFromSourceLine(line);
	const memoryValueTarget =
		moduleId && memoryId
			? {
					moduleId,
					memoryId,
					insertAtLineIndex: text.length,
				}
			: undefined;

	return {
		text,
		colors: getSelectedLineTooltipColors(line, text, spriteLookups),
		memoryValueTarget,
	};
}

export default function tooltip(store: StateManager<State>): void {
	const state = store.getState();

	function syncSelectedLineTooltip(): void {
		const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;

		if (!state.featureFlags.codeLineSelection || !selectedCodeBlock) {
			store.set('tooltip.text', []);
			store.set('tooltip.colors', []);
			store.set('tooltip.memoryValueTarget', undefined);
			return;
		}

		const content = getSelectedLineTooltipContent(
			selectedCodeBlock.code[selectedCodeBlock.cursor.row],
			TOOLTIP_WRAP_WIDTH,
			getSelectedCodeBlockStackAnalysisLine(state, selectedCodeBlock),
			state.graphicHelper.spriteLookups,
			selectedCodeBlock.moduleId
		);

		store.set('tooltip.text', content.text);
		store.set('tooltip.colors', content.colors);
		store.set('tooltip.memoryValueTarget', content.memoryValueTarget);
	}

	store.subscribe('graphicHelper.selectedCodeBlock', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor.row', syncSelectedLineTooltip);
	store.subscribe('featureFlags.codeLineSelection', syncSelectedLineTooltip);
	store.subscribe('compiler.compiledModules', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.spriteLookups', syncSelectedLineTooltip);

	syncSelectedLineTooltip();
}
