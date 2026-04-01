import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { WatchDirectiveData } from './data';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveWatchDirectiveWidget(
	_debugger: WatchDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.moduleId) {
		return;
	}

	const memory = resolveMemoryIdentifier(state, graphicData.moduleId, _debugger.id);
	if (!memory) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[_debugger.lineNumber] ?? _debugger.lineNumber;

	graphicData.widgets.debuggers.push({
		width: state.viewport.vGrid * 2,
		height: state.viewport.hGrid,
		x:
			state.viewport.vGrid * (3 + graphicData.lineNumberColumnWidth) +
			state.viewport.vGrid * graphicData.code[_debugger.lineNumber].length,
		y: gapCalculator(displayRow, graphicData.gaps) * state.viewport.hGrid,
		id: _debugger.id,
		memory: memory.memory,
		showAddress: memory.showAddress,
		showEndAddress: memory.showEndAddress,
		showBinary: memory.showBinary,
		showHex: memory.showHex,
		bufferPointer: memory.bufferPointer,
	});
}

export function createWatchDirectiveWidgetContribution(_debugger: WatchDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveWatchDirectiveWidget(_debugger, graphicData, state, directiveState);
		},
	};
}
