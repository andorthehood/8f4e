import type { DirectiveDerivedState, DirectiveWidgetContribution } from '@8f4e/editor-state-types';
import gapCalculator from '~/features/code-editing/gapCalculator';
import getCodeBlockModuleId from '~/pureHelpers/getCodeBlockModuleId';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';
import type { SwitchDirectiveData } from './data';

type DirectiveWidgetResolver = NonNullable<DirectiveWidgetContribution['afterGraphicDataWidthCalculation']>;

function resolveSwitchDirectiveWidget(
	_switch: SwitchDirectiveData,
	graphicData: Parameters<DirectiveWidgetResolver>[0],
	state: Parameters<DirectiveWidgetResolver>[1],
	directiveState: DirectiveDerivedState
): void {
	if (!graphicData.name) {
		return;
	}

	const memory = resolveMemoryIdentifier(state, getCodeBlockModuleId(graphicData), _switch.id)?.memory;

	if (!memory) {
		return;
	}

	const displayRow = directiveState.displayModel.rawRowToDisplayRow[_switch.lineNumber] ?? _switch.lineNumber;

	graphicData.widgets.switches.push({
		width: state.viewport.vGrid * 4,
		height: state.viewport.hGrid,
		x: graphicData.width - 4 * state.viewport.vGrid,
		y: gapCalculator(displayRow, graphicData.gaps) * state.viewport.hGrid,
		id: memory.id,
		wordAlignedAddress: memory.wordAlignedAddress,
		isInteger: memory.isInteger ?? true,
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
