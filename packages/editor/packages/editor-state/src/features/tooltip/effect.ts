import {
	ArgumentType,
	getInstructionSpec,
	getInstructionStackSignature,
	type AST,
	type CompiledStackAnalysisLine,
	type InstructionSpec,
	type Stack,
	type StackItem,
} from '@8f4e/compiler-spec';

import wrapText from '../code-blocks/utils/wrapText';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

export const TOOLTIP_WRAP_WIDTH = 32;

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

export default function tooltip(store: StateManager<State>): void {
	const state = store.getState();

	function syncSelectedLineTooltip(): void {
		const selectedCodeBlock = state.graphicHelper.selectedCodeBlock;

		if (!state.featureFlags.codeLineSelection || !selectedCodeBlock) {
			store.set('tooltip.text', []);
			return;
		}

		store.set(
			'tooltip.text',
			getSelectedLineTooltipText(
				selectedCodeBlock.code[selectedCodeBlock.cursor.row],
				TOOLTIP_WRAP_WIDTH,
				getSelectedCodeBlockStackAnalysisLine(state, selectedCodeBlock)
			)
		);
	}

	store.subscribe('graphicHelper.selectedCodeBlock', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.code', syncSelectedLineTooltip);
	store.subscribe('graphicHelper.selectedCodeBlock.cursor.row', syncSelectedLineTooltip);
	store.subscribe('featureFlags.codeLineSelection', syncSelectedLineTooltip);
	store.subscribe('compiler.compiledModules', syncSelectedLineTooltip);

	syncSelectedLineTooltip();
}
