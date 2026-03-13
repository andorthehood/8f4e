import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { ScanDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveScanDirectiveWidget(
	scanner: ScanDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const buffer = resolveMemoryIdentifier(state, graphicData.moduleId, scanner.bufferMemoryId);
	const pointer = resolveMemoryIdentifier(state, graphicData.moduleId, scanner.pointerMemoryId);

	if (!buffer || !pointer) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[scanner.lineNumber] ?? scanner.lineNumber;

	graphicData.widgets.bufferScanners.push({
		width: graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		height: state.viewport.hGrid * 2,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		buffer,
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
