import { gapCalculator } from '../../../../helpers/codeEditing/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function errorMessages(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.errorMessages = [];
	state.compiler.compilationErrors.forEach(compilationError => {
		if (compilationError.moduleId !== graphicData.id) {
			return;
		}
		graphicData.extras.errorMessages.push({
			x: 0,
			y: (gapCalculator(compilationError.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
			message: ['Error:', compilationError.message],
			lineNumber: compilationError.lineNumber,
		});
	});
}
