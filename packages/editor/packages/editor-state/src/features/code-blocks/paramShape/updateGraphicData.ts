import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import gapCalculator from '../../code-editing/gapCalculator';
import type { DirectiveDerivedState } from '../features/directives/registry';

type CompiledFunction = NonNullable<NonNullable<State['compiler']['compiledFunctions']>[string]>;

function getParamShapeLabelsByLineNumber(compiledFunction: CompiledFunction): Map<number, string[]> {
	const labelsByLineNumber = new Map<number, string[]>();

	for (const expansion of compiledFunction.paramShapeExpansions ?? []) {
		labelsByLineNumber.set(
			expansion.lineNumber,
			expansion.parameters.map(parameter => `${parameter.type} ${parameter.name}`)
		);
	}

	return labelsByLineNumber;
}

function getCompiledFunction(graphicData: CodeBlockGraphicData, state: State): CompiledFunction | undefined {
	return graphicData.name ? state.compiler.compiledFunctions?.[graphicData.name] : undefined;
}

export default function paramShape(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState
): void {
	if (graphicData.disabled || graphicData.blockType !== 'function') {
		return;
	}

	const compiledFunction = getCompiledFunction(graphicData, state);
	if (!compiledFunction) {
		return;
	}

	for (const [lineNumber, labels] of getParamShapeLabelsByLineNumber(compiledFunction)) {
		if (labels.length === 0) {
			continue;
		}

		directiveState.layoutContributions.push({
			rawRow: lineNumber,
			rows: labels.length,
		});
	}
}

export function updateParamShapeDeclarations(
	graphicData: CodeBlockGraphicData,
	state: State,
	directiveState: DirectiveDerivedState
): void {
	if (graphicData.disabled || graphicData.blockType !== 'function') {
		return;
	}

	const compiledFunction = getCompiledFunction(graphicData, state);
	if (!compiledFunction) {
		return;
	}

	const textX = (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid;
	for (const [lineNumber, labels] of getParamShapeLabelsByLineNumber(compiledFunction)) {
		const displayRow = directiveState.displayModel.rawRowToDisplayRow[lineNumber];
		if (displayRow === undefined) {
			continue;
		}

		labels.forEach((text, index) => {
			graphicData.widgets.shapeDeclarations.push({
				x: textX,
				y: (gapCalculator(displayRow, graphicData.gaps) + index + 1) * state.viewport.hGrid,
				text,
			});
		});
	}
}
