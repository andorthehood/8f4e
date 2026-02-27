import parseInputs from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateInputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.inputs = [];
	const moduleId = graphicData.moduleId;
	if (!moduleId) {
		return;
	}

	parseInputs(graphicData.code).forEach(input => {
		const memory = state.compiler.compiledModules[moduleId]?.memoryMap[input.id];

		if (!memory) {
			return;
		}

		graphicData.extras.inputs.push({
			width: state.viewport.vGrid * 2,
			height: state.viewport.hGrid,
			x: 0,
			y: gapCalculator(input.lineNumber, graphicData.gaps) * state.viewport.hGrid,
			id: input.id,
			wordAlignedAddress: memory.wordAlignedAddress,
			codeBlock: graphicData,
		});
	});
}
