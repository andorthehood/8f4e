import parseSwitches from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateSwitchesGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.widgets.switches = [];
	parseSwitches(graphicData.code).forEach(_switch => {
		graphicData.widgets.switches.push({
			width: state.viewport.vGrid * 4,
			height: state.viewport.hGrid,
			x: graphicData.width - 4 * state.viewport.vGrid,
			y: gapCalculator(_switch.lineNumber, graphicData.gaps) * state.viewport.hGrid,
			id: _switch.id,
			offValue: _switch.offValue,
			onValue: _switch.onValue,
		});
	});
}
