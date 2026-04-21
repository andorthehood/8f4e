import { resolveElementCount, resolveTypedValueSpec } from '../shared/typedValueSpec';

import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { WaveDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveWaveDirectiveWidget(
	wave: WaveDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const startAddress = resolveMemoryIdentifier(state, graphicData.moduleId, wave.startAddressMemoryId);
	const length = resolveElementCount(wave.length, graphicData.moduleId, state);
	const pointer = resolveMemoryIdentifier(state, graphicData.moduleId, wave.pointerMemoryId);
	const valueSpec = startAddress ? resolveTypedValueSpec(startAddress) : undefined;

	if (!startAddress || !length || !valueSpec || valueSpec.elementByteSize <= 0) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[wave.lineNumber] ?? wave.lineNumber;

	graphicData.widgets.arrayWaves.push({
		width: graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		height: state.viewport.hGrid * wave.heightRows,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		startAddress,
		elementByteSize: valueSpec.elementByteSize,
		inverseElementByteSize: 1 / valueSpec.elementByteSize,
		baseSampleShift: valueSpec.baseSampleShift,
		length,
		pointer,
		valueType: valueSpec.valueType,
		minValue: valueSpec.minValue,
		maxValue: valueSpec.maxValue,
		inverseValueRange: valueSpec.maxValue === valueSpec.minValue ? 0 : 1 / (valueSpec.maxValue - valueSpec.minValue),
	});
}

export function createWaveDirectiveWidgetContribution(wave: WaveDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveWaveDirectiveWidget(wave, graphicData, state, directiveState);
		},
	};
}
