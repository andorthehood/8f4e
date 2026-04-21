import { resolveDirectOrPointerTypedValueSpec } from '../shared/typedValueSpec';

import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { MeterDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveMeterDirectiveWidget(
	meter: MeterDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const memory = resolveMemoryIdentifier(state, graphicData.moduleId, meter.memoryId);
	const valueSpec = memory ? resolveDirectOrPointerTypedValueSpec(memory) : undefined;

	if (!memory || !valueSpec) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[meter.lineNumber] ?? meter.lineNumber;
	const minValue = meter.minValueOverride ?? valueSpec.minValue;
	const maxValue = meter.maxValueOverride ?? valueSpec.maxValue;

	graphicData.widgets.arrayMeters.push({
		width: graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		height: state.viewport.hGrid,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		memory,
		baseSampleShift: valueSpec.baseSampleShift,
		valueType: valueSpec.valueType,
		minValue,
		maxValue,
	});
}

export function createMeterDirectiveWidgetContribution(meter: MeterDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveMeterDirectiveWidget(meter, graphicData, state, directiveState);
		},
	};
}
