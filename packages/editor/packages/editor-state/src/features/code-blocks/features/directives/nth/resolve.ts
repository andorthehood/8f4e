import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { NthDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveNthDirectiveWidget(
	nth: NthDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const moduleIndex = Object.keys(state.compiler.compiledModules).indexOf(graphicData.moduleId);
	if (moduleIndex === -1) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[nth.lineNumber] ?? nth.lineNumber;

	graphicData.widgets.debuggers.push({
		width: state.viewport.vGrid * 2,
		height: state.viewport.hGrid,
		x:
			state.viewport.vGrid * (3 + graphicData.lineNumberColumnWidth) +
			state.viewport.vGrid * graphicData.code[nth.lineNumber].length,
		y: gapCalculator(displayRow, graphicData.gaps) * state.viewport.hGrid,
		id: '__nth__',
		showAddress: false,
		showEndAddress: false,
		bufferPointer: 0,
		displayFormat: 'decimal',
		text: String(moduleIndex + 1),
	});
}

export function createNthDirectiveWidgetContribution(nth: NthDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveNthDirectiveWidget(nth, graphicData, state, directiveState);
		},
	};
}
