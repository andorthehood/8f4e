import { gapCalculator } from '../../../../helpers/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function errorMessages(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.errorMessages = [];
	state.compiler.buildErrors.forEach(buildError => {
		if (buildError.moduleId !== graphicData.id) {
			return;
		}
		graphicData.extras.errorMessages.push({
			x: 0,
			y: (gapCalculator(buildError.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
			message: ['Error:', buildError.message],
			lineNumber: buildError.lineNumber,
		});
	});
}
