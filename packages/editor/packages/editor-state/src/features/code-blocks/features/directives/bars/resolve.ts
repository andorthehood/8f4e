import { resolveElementCount, resolveTypedValueSpec } from '../shared/typedValueSpec';

import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { BarsDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function createStaticColumnLayout(width: number, length: number) {
	if (length <= 0) {
		return [];
	}

	const columnCount = Math.min(length, width);
	const columnWidth = Math.max(1, Math.floor(width / Math.max(columnCount, 1)));

	return Array.from({ length: columnCount }, (_, column) => ({
		x: column * columnWidth,
		width: columnWidth,
		sliceStart: Math.floor((column / columnCount) * length),
		sliceEnd: Math.max(
			Math.floor(((column + 1) / columnCount) * length),
			Math.floor((column / columnCount) * length) + 1
		),
	}));
}

function resolveBarsDirectiveWidget(
	bars: BarsDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const startAddress = resolveMemoryIdentifier(state, graphicData.moduleId, bars.startAddressMemoryId);
	const length = resolveElementCount(bars.length, graphicData.moduleId, state);
	const valueSpec = startAddress ? resolveTypedValueSpec(startAddress) : undefined;

	if (!startAddress || !valueSpec || !length) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[bars.lineNumber] ?? bars.lineNumber;
	const width = graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid;
	const minValue = bars.minValueOverride ?? valueSpec.minValue;
	const maxValue = bars.maxValueOverride ?? valueSpec.maxValue;
	const staticBaseValueIndex =
		startAddress.showAddress || (!startAddress.memory.pointeeBaseType && !startAddress.memory.isPointingToPointer)
			? (startAddress.memory.byteAddress >> valueSpec.baseSampleShift) + startAddress.bufferPointer
			: undefined;

	graphicData.widgets.arrayBars.push({
		width,
		height: state.viewport.hGrid * 8,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		inverseValueRange: maxValue === minValue ? 0 : 1 / (maxValue - minValue),
		staticBaseValueIndex,
		staticColumnLayout: typeof length === 'number' ? createStaticColumnLayout(width, length) : undefined,
		startAddress,
		baseSampleShift: valueSpec.baseSampleShift,
		length,
		valueType: valueSpec.valueType,
		minValue,
		maxValue,
	});
}

export function createBarsDirectiveWidgetContribution(bars: BarsDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveBarsDirectiveWidget(bars, graphicData, state, directiveState);
		},
	};
}
