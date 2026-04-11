import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { ScanDirectiveData } from './data';
import type { MemoryIdentifier } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function getPointeeElementByteSize(memory: MemoryIdentifier['memory']): number {
	if (!memory.pointeeBaseType) {
		return 0;
	}

	if (memory.isPointingToPointer) {
		return 4;
	}

	if (memory.pointeeBaseType === 'float64') {
		return 8;
	}

	if (memory.pointeeBaseType === 'int8' || memory.pointeeBaseType === 'int8u') {
		return 1;
	}

	if (memory.pointeeBaseType === 'int16' || memory.pointeeBaseType === 'int16u') {
		return 2;
	}

	return 4;
}

function getStartElementByteSize(startAddress: MemoryIdentifier): number {
	if (startAddress.showAddress) {
		return startAddress.memory.elementWordSize;
	}

	return getPointeeElementByteSize(startAddress.memory);
}

function resolveScanDirectiveWidget(
	scanner: ScanDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const startAddress = resolveMemoryIdentifier(state, graphicData.moduleId, scanner.startAddressMemoryId);
	const length =
		typeof scanner.length === 'number'
			? scanner.length
			: resolveMemoryIdentifier(state, graphicData.moduleId, scanner.length);
	const pointer = resolveMemoryIdentifier(state, graphicData.moduleId, scanner.pointerMemoryId);
	const elementByteSize = startAddress ? getStartElementByteSize(startAddress) : 0;

	if (!startAddress || !length || !pointer || elementByteSize <= 0) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[scanner.lineNumber] ?? scanner.lineNumber;

	graphicData.widgets.arrayScanners.push({
		width: graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		height: state.viewport.hGrid * 2,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		startAddress,
		elementByteSize,
		length,
		pointer,
	});
}

export function createScanDirectiveWidgetContribution(scanner: ScanDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveScanDirectiveWidget(scanner, graphicData, state, directiveState);
		},
	};
}
