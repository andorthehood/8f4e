import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import gapCalculator from '../../code-editing/gapCalculator';
import type { DirectiveDerivedState } from '../features/directives/registry';

type CompiledFunction = NonNullable<NonNullable<State['compiler']['compiledFunctions']>[string]>;

function getParamShapeLabelsByLineNumber(compiledFunction: CompiledFunction): Map<number, string[]> {
	const labelsByLineNumber = new Map<number, string[]>();
	const paramShapeLineNumbers = new Set(
		compiledFunction.ast.lines.filter(line => line.instruction === 'paramShape').map(line => line.lineNumber)
	);

	for (const line of compiledFunction.ast.lines) {
		if (line.instruction !== 'param' || !paramShapeLineNumbers.has(line.lineNumber)) {
			continue;
		}

		const labels = labelsByLineNumber.get(line.lineNumber) ?? [];
		labels.push(`${line.arguments[0].value} ${line.arguments[1].value}`);
		labelsByLineNumber.set(line.lineNumber, labels);
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
	if (!compiledFunction || compiledFunction.ast.type !== 'function') {
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
	if (!compiledFunction || compiledFunction.ast.type !== 'function') {
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
