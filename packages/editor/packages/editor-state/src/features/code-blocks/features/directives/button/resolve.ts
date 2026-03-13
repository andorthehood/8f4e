import type { DirectiveDerivedState, DirectiveWidgetContribution } from '../types';
import type { ButtonDirectiveData } from './parse';

import gapCalculator from '~/features/code-editing/gapCalculator';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveButtonDirectiveWidget(
	button: ButtonDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	const displayRow = directiveState.displayModel.rawRowToDisplayRow[button.lineNumber] ?? button.lineNumber;

	graphicData.widgets.buttons.push({
		width: state.viewport.vGrid * 4,
		height: state.viewport.hGrid,
		x: graphicData.width - 4 * state.viewport.vGrid,
		y: gapCalculator(displayRow, graphicData.gaps) * state.viewport.hGrid,
		id: button.id,
		offValue: button.offValue,
		onValue: button.onValue,
	});
}

export function createButtonDirectiveWidgetContribution(button: ButtonDirectiveData): DirectiveWidgetContribution {
	return {
		afterGraphicDataWidthCalculation: (graphicData, state, directiveState) => {
			resolveButtonDirectiveWidget(button, graphicData, state, directiveState);
		},
	};
}
