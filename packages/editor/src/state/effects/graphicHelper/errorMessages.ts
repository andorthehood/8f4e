import { CodeBlockGraphicData, State } from '../../types';
import { gapCalculator } from '../../helpers/editor';

export default function errorMessages(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.errorMessages.clear();
	state.compiler.buildErrors.forEach(buildError => {
		if (buildError.moduleId !== graphicData.id) {
			return;
		}
		graphicData.errorMessages.set(buildError.lineNumber, {
			x: 0,
			y: (gapCalculator(buildError.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
			message: ['Error:', buildError.message],
		});
	});
}
