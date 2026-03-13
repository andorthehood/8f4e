import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { SwitchDirectiveData } from './parse';

import gapCalculator from '~/features/code-editing/gapCalculator';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveSwitchDirectiveWidget(
	_switch: SwitchDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	const displayRow = directiveState.displayModel.rawRowToDisplayRow[_switch.lineNumber] ?? _switch.lineNumber;

	graphicData.widgets.switches.push({
		width: state.viewport.vGrid * 4,
		height: state.viewport.hGrid,
		x: graphicData.width - 4 * state.viewport.vGrid,
		y: gapCalculator(displayRow, graphicData.gaps) * state.viewport.hGrid,
		id: _switch.id,
		offValue: _switch.offValue,
		onValue: _switch.onValue,
	});
}

export function createSwitchDirectiveWidgetContribution(_switch: SwitchDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveSwitchDirectiveWidget(_switch, graphicData, state, directiveState);
		},
	};
}
