import { parseSwitches } from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function updateSwitchesGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.switches.clear();
	parseSwitches(graphicData.trimmedCode).forEach(_switch => {
		graphicData.extras.switches.set(_switch.id, {
			width: state.graphicHelper.globalViewport.vGrid * 4,
			height: state.graphicHelper.globalViewport.hGrid,
			x: graphicData.width - 4 * state.graphicHelper.globalViewport.vGrid,
			y: gapCalculator(_switch.lineNumber, graphicData.gaps) * state.graphicHelper.globalViewport.hGrid,
			id: _switch.id,
			offValue: _switch.offValue,
			onValue: _switch.onValue,
		});
	});
}
