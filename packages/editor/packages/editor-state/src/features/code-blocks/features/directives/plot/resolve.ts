import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { PlotDirectiveData } from './parse';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['resolve']>;

function resolvePlotDirectiveWidget(
	plotter: PlotDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const buffer = resolveMemoryIdentifier(state, graphicData.moduleId, plotter.bufferMemoryId);
	const bufferLength = resolveMemoryIdentifier(state, graphicData.moduleId, plotter.bufferLengthMemoryId);

	if (!buffer) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[plotter.lineNumber] ?? plotter.lineNumber;

	graphicData.extras.bufferPlotters.push({
		width: state.viewport.vGrid * 2,
		height: state.viewport.hGrid,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		buffer,
		minValue: plotter.minValue,
		maxValue: plotter.maxValue,
		bufferLength,
	});
}

export function createPlotDirectiveWidgetContribution(plotter: PlotDirectiveData): DirectiveWidgetContribution {
	return {
		resolve: (graphicData, state, directiveState) => {
			resolvePlotDirectiveWidget(plotter, graphicData, state, directiveState);
		},
	};
}
