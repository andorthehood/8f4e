import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { CrossfadeDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveCrossfadeDirectiveWidget(
	crossfade: CrossfadeDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const leftMemory = resolveMemoryIdentifier(state, graphicData.moduleId, crossfade.leftMemoryId);
	const rightMemory = resolveMemoryIdentifier(state, graphicData.moduleId, crossfade.rightMemoryId);

	if (!leftMemory || !rightMemory) {
		return;
	}

	const left = leftMemory.memory;
	const right = rightMemory.memory;

	if (
		left.isInteger ||
		right.isInteger ||
		left.isFloat64 ||
		right.isFloat64 ||
		left.numberOfElements !== 1 ||
		right.numberOfElements !== 1
	) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[crossfade.lineNumber] ?? crossfade.lineNumber;
	const width = graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid;
	const handleWidth = Math.min(state.viewport.vGrid, width);
	const trackWidth = Math.max(width - handleWidth, 1);

	graphicData.widgets.crossfades.push({
		width,
		height: state.viewport.hGrid * 2,
		x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
		y: (gapCalculator(displayRow, graphicData.gaps) + 1) * state.viewport.hGrid,
		leftId: left.id,
		rightId: right.id,
		leftWordAddress: left.wordAlignedAddress,
		rightWordAddress: right.wordAlignedAddress,
		handleWidth,
		trackWidth,
		centerX: Math.floor(trackWidth / 2),
	});
}

export function createCrossfadeDirectiveWidgetContribution(
	crossfade: CrossfadeDirectiveData
): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveCrossfadeDirectiveWidget(crossfade, graphicData, state, directiveState);
		},
	};
}
