import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { PlotDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolvePlotDirectiveWidget(
	plotter: PlotDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const array = resolveMemoryIdentifier(state, graphicData.moduleId, plotter.arrayMemoryId);
	const arrayLength = resolveMemoryIdentifier(state, graphicData.moduleId, plotter.arrayLengthMemoryId);

	if (!array) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[plotter.lineNumber] ?? plotter.lineNumber;

	graphicData.widgets.arrayPlotters.push({
		width: state.viewport.vGrid * 2,
		height: state.viewport.hGrid,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		array,
		minValue: plotter.minValue,
		maxValue: plotter.maxValue,
		arrayLength,
	});
}

export function createPlotDirectiveWidgetContribution(plotter: PlotDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolvePlotDirectiveWidget(plotter, graphicData, state, directiveState);
		},
	};
}
