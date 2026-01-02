import parseButtons from './codeParser';

import gapCalculator from '../../../../pureHelpers/codeEditing/gapCalculator';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function updateButtonsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.buttons = [];
	parseButtons(graphicData.code).forEach(_switch => {
		graphicData.extras.buttons.push({
			width: state.graphicHelper.viewport.vGrid * 4,
			height: state.graphicHelper.viewport.hGrid,
			x: graphicData.width - 4 * state.graphicHelper.viewport.vGrid,
			y: gapCalculator(_switch.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
			id: _switch.id,
			offValue: _switch.offValue,
			onValue: _switch.onValue,
		});
	});
}
