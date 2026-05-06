import { getInfoEntryCount } from './entries';

import type { DirectiveDerivedState, DirectiveWidgetContribution } from '@8f4e/editor-state-types';
import type { InfoDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function formatInfoValue(value: unknown): string {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
		return String(value);
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function resolveInfoDirectiveWidget(
	info: InfoDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	const rowCount = getInfoEntryCount(state, info.id);

	if (rowCount === 0) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[info.lineNumber] ?? info.lineNumber;
	const x = (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid;
	const width = Math.max(state.viewport.vGrid, graphicData.width - x);

	graphicData.widgets.infoPanels.push({
		width,
		height: rowCount * state.viewport.hGrid,
		x,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		id: info.id,
		rowCount,
	});
}

export function createInfoDirectiveWidgetContribution(info: InfoDirectiveData): DirectiveWidgetContribution {
	return {
		beforeGraphicDataWidthCalculation: (graphicData, state) => {
			const record = state.info[info.id];
			const entries = record && typeof record === 'object' && !Array.isArray(record) ? Object.entries(record) : [];
			const maxEntryWidth = entries.reduce((max, [key, value]) => {
				return Math.max(max, key.length + 2 + formatInfoValue(value).length);
			}, 0);

			if (maxEntryWidth > 0) {
				graphicData.minGridWidth = Math.max(
					graphicData.minGridWidth ?? 0,
					maxEntryWidth + graphicData.lineNumberColumnWidth + 3
				);
			}
		},
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveInfoDirectiveWidget(info, graphicData, state, directiveState);
		},
	};
}
