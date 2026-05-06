import type { DirectiveDerivedState, DirectiveWidgetContribution } from '@8f4e/editor-state-types';
import type { InfoDirectiveData } from './data';
import type { InfoLayout } from './entries';

import gapCalculator from '~/features/code-editing/gapCalculator';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveInfoDirectiveWidget(
	info: InfoDirectiveData,
	layout: InfoLayout,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (layout.rowCount === 0) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[info.lineNumber] ?? info.lineNumber;
	const x = (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid;
	const width = Math.max(state.viewport.vGrid, graphicData.width - x);

	graphicData.widgets.infoPanels.push({
		width,
		height: layout.rowCount * state.viewport.hGrid,
		x,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		id: info.id,
		rowCount: layout.rowCount,
		keyColumnWidth: layout.keyColumnWidth,
	});
}

export function createInfoDirectiveWidgetContribution(
	info: InfoDirectiveData,
	layout: InfoLayout
): DirectiveWidgetContribution {
	return {
		beforeGraphicDataWidthCalculation: graphicData => {
			if (layout.maxEntryWidth > 0) {
				graphicData.minGridWidth = Math.max(
					graphicData.minGridWidth ?? 0,
					layout.maxEntryWidth + graphicData.lineNumberColumnWidth + 3
				);
			}
		},
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveInfoDirectiveWidget(info, layout, graphicData, state, directiveState);
		},
	};
}
