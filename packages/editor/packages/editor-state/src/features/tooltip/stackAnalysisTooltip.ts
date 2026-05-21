import { maxInlineStackItemCount } from './constants';

import type { CompiledStackAnalysisLine, Stack, StackItem } from '@8f4e/compiler-spec';
import type { TooltipHighlightRange } from './types';

const stackBeforeInlineLabel = 'before ';
const stackBeforeBlockLabel = 'before: ';
const stackAfterLabel = 'after: ';

type StackItemMarker = 'input' | 'output';

/**
 * Returns the part of a stack tooltip line that should use the highlight color.
 */
export function getStackValueHighlightRange(line: string): TooltipHighlightRange | undefined {
	if (line.startsWith(stackBeforeInlineLabel)) {
		return { start: stackBeforeInlineLabel.length, end: line.length };
	}

	if (line.startsWith(stackBeforeBlockLabel)) {
		return { start: stackBeforeBlockLabel.length, end: line.length };
	}

	if (line.startsWith(stackAfterLabel)) {
		return { start: stackAfterLabel.length, end: line.length };
	}

	if (line.startsWith('  ')) {
		return { start: 2, end: line.length };
	}

	if (line === ']') {
		return { start: 0, end: line.length };
	}

	return undefined;
}

/**
 * Formats one stack item, marking consumed inputs as `>item` and produced outputs as `item<`.
 */
function getStackItemLabel(item: StackItem, marker?: StackItemMarker): string {
	let label: string;

	if (item.address || item.pointeeBaseType || item.isPointingToPointer) {
		label = 'ptr';
	} else if (item.isFloat64) {
		label = 'float64';
	} else {
		label = item.isInteger ? 'int' : 'float';
	}

	const valueLabel = item.knownIntegerValue === undefined ? label : `${label}=${item.knownIntegerValue}`;

	if (marker === 'input') {
		return `>${valueLabel}`;
	}

	if (marker === 'output') {
		return `${valueLabel}<`;
	}

	return valueLabel;
}

/**
 * Stack analysis lists the top of the stack at the end, so markers apply from the tail.
 */
function isMarkedStackItem(index: number, stack: Stack, markedItemCount: number): boolean {
	return index >= stack.length - markedItemCount;
}

/**
 * Formats a compact inline stack display.
 */
function formatStack(stack: Stack, markedItemCount: number, marker: StackItemMarker): string {
	return `[${stack.map((item, index) => getStackItemLabel(item, isMarkedStackItem(index, stack, markedItemCount) ? marker : undefined)).join(', ')}]`;
}

/**
 * Formats stack tooltip text inline for short stacks and as a block for longer stacks.
 */
function formatStackTooltipLines(
	inlineLabel: string,
	blockLabel: string,
	stack: Stack,
	markedItemCount: number,
	marker: StackItemMarker
): string[] {
	if (stack.length <= maxInlineStackItemCount) {
		return [`${inlineLabel}${formatStack(stack, markedItemCount, marker)}`];
	}

	const stackItemLines = stack.map((item, index) => {
		const suffix = index === stack.length - 1 ? '' : ',';
		return `  ${getStackItemLabel(item, isMarkedStackItem(index, stack, markedItemCount) ? marker : undefined)}${suffix}`;
	});

	return [`${blockLabel}[`, ...stackItemLines, ']'];
}

/**
 * Builds before/after stack tooltip lines from compiler stack analysis.
 */
export function getStackAnalysisTooltipText(stackAnalysisLine: CompiledStackAnalysisLine | undefined): string[] {
	if (!stackAnalysisLine) {
		return [];
	}

	const { consumedOperands, producedStackItems, stackBefore, stackAfter } = stackAnalysisLine.stackAnalysis;

	return [
		...formatStackTooltipLines(
			stackBeforeInlineLabel,
			stackBeforeBlockLabel,
			stackBefore,
			consumedOperands.length,
			'input'
		),
		...formatStackTooltipLines(stackAfterLabel, stackAfterLabel, stackAfter, producedStackItems.length, 'output'),
	];
}
