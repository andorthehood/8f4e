import { parseButtons } from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function updateButtonsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.buttons.clear();
	parseButtons(graphicData.trimmedCode).forEach(_switch => {
		graphicData.extras.buttons.set(_switch.id, {
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
