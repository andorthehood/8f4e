import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { SliderDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveSliderDirectiveWidget(
	slider: SliderDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const memory = state.compiler.compiledModules[graphicData.moduleId]?.memoryMap[slider.id];

	if (!memory) {
		return;
	}

	let min = slider.min;
	let max = slider.max;

	if (min === undefined || max === undefined) {
		if (memory.isInteger) {
			min = min ?? 0;
			max = max ?? 127;
		} else {
			min = min ?? 0;
			max = max ?? 1;
		}
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[slider.lineNumber] ?? slider.lineNumber;

	graphicData.widgets.sliders.push({
		width: graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		height: state.viewport.hGrid * 2,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		id: slider.id,
		min,
		max,
		step: slider.step,
	});
}

export function createSliderDirectiveWidgetContribution(slider: SliderDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveSliderDirectiveWidget(slider, graphicData, state, directiveState);
		},
	};
}
