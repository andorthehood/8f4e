import type { DirectiveDerivedState, DirectiveWidgetContribution, State } from '@8f4e/editor-state-types';
import type { CompiledStackAnalysisLine } from '@8f4e/language-spec';
import gapCalculator from '~/features/code-editing/gapCalculator';
import { getTabStopsByLine, getVisualLineWidth } from '~/features/code-editing/tabLayout';
import getCodeBlockModuleId from '~/pureHelpers/getCodeBlockModuleId';
import { getCompiledFunctionForCodeBlock } from '../../../utils/getCompiledFunctionForCodeBlock';
import { formatDebugStack } from './formatStack';

interface DebugDirectiveData {
	lineNumber: number;
	isTrailing: boolean;
}

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function getStackAnalysisLines(
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: State
): CompiledStackAnalysisLine[] | undefined {
	if (graphicData.blockType === 'function') {
		return getCompiledFunctionForCodeBlock(graphicData, state)?.stackAnalysis;
	}

	return state.compiler.compiledModules[getCodeBlockModuleId(graphicData)]?.stackAnalysis;
}

function findStackAnalysisLine(
	lines: CompiledStackAnalysisLine[],
	lineNumber: number,
	isTrailing: boolean
): CompiledStackAnalysisLine | undefined {
	if (isTrailing) {
		return lines.find(line => line.lineNumber === lineNumber);
	}

	let precedingLine: CompiledStackAnalysisLine | undefined;
	for (const line of lines) {
		if (line.lineNumber >= lineNumber) {
			break;
		}
		precedingLine = line;
	}
	return precedingLine;
}

function resolveDebugDirectiveWidget(
	debug: DebugDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	const stackAnalysisLines = getStackAnalysisLines(graphicData, state);
	if (!stackAnalysisLines) {
		return;
	}

	const stackAnalysisLine = findStackAnalysisLine(stackAnalysisLines, debug.lineNumber, debug.isTrailing);
	if (!stackAnalysisLine) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[debug.lineNumber] ?? debug.lineNumber;
	const tabStopsByLine = getTabStopsByLine(graphicData.code);
	const visualLineWidth = getVisualLineWidth(
		graphicData.code[debug.lineNumber] || '',
		tabStopsByLine[debug.lineNumber] || []
	);

	graphicData.widgets.debuggers.push({
		width: state.viewport.vGrid * 2,
		height: state.viewport.hGrid,
		x: state.viewport.vGrid * (3 + graphicData.lineNumberColumnWidth + visualLineWidth),
		y: gapCalculator(displayRow, graphicData.gaps) * state.viewport.hGrid,
		id: `debug:${debug.lineNumber}`,
		showAddress: false,
		showEndAddress: false,
		bufferPointer: 0,
		displayFormat: 'decimal',
		text: formatDebugStack(stackAnalysisLine.stackAnalysis.stackAfter),
	});
}

export function createDebugDirectiveWidgetContribution(debug: DebugDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveDebugDirectiveWidget(debug, graphicData, state, directiveState);
		},
	};
}
