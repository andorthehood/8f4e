import { getInfoEntryCount, getInfoRecord, isRenderableInfoValue } from './entries';

import type { DirectiveDerivedState, DirectiveWidgetContribution } from '@8f4e/editor-state-types';
import type { InfoDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function formatInfoValue(value: string | number | boolean): string {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'boolean') {
		return String(value);
	}

	if (!Number.isFinite(value) || Number.isInteger(value)) {
		return String(value);
	}

	const roundedValue = Math.round(value * 10000) / 10000;
	return String(Object.is(roundedValue, -0) ? 0 : roundedValue);
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
			const record = getInfoRecord(state, info.id);
			let maxEntryWidth = 0;

			if (record) {
				for (const key in record) {
					const value = record[key];

					if (!Object.prototype.hasOwnProperty.call(record, key) || !isRenderableInfoValue(value)) {
						continue;
					}

					maxEntryWidth = Math.max(maxEntryWidth, key.length + 2 + formatInfoValue(value).length);
				}
			}

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
