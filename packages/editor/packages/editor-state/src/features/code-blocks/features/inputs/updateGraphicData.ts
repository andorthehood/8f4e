import parseInputs from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateInputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.widgets.inputs = [];
	const moduleId = graphicData.moduleId;
	if (!moduleId) {
		return;
	}

	parseInputs(graphicData.code).forEach(input => {
		const memory = state.compiler.compiledModules[moduleId]?.memoryMap[input.id];

		if (!memory) {
			return;
		}

		const width = state.viewport.vGrid * 2;
		const height = state.viewport.hGrid;
		const x = 0;
		const y = gapCalculator(input.lineNumber, graphicData.gaps) * state.viewport.hGrid;

		graphicData.widgets.inputs.push({
			width,
			height,
			x,
			y,
			wireX: x + width / 2,
			wireY: y + height / 2,
			id: input.id,
			wordAlignedAddress: memory.wordAlignedAddress,
			codeBlock: graphicData,
		});
	});
}
