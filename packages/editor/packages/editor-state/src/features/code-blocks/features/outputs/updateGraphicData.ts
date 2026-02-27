import parseOutputs from './codeParser';

import type { CodeBlockGraphicData, Output, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateOutputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.outputs = [];
	const moduleId = graphicData.moduleId;
	if (!moduleId) {
		return;
	}

	parseOutputs(graphicData.code).forEach(output => {
		const memory = state.compiler.compiledModules[moduleId]?.memoryMap[output.id];

		if (!memory) {
			return;
		}

		const out: Output = {
			width: state.viewport.vGrid * 2,
			height: state.viewport.hGrid,
			x: graphicData.width - 3 * state.viewport.vGrid,
			y: gapCalculator(output.lineNumber, graphicData.gaps) * state.viewport.hGrid,
			id: output.id,
			codeBlock: graphicData,
			calibratedMax: 0,
			calibratedMin: 0,
			memory,
		};

		graphicData.extras.outputs.push(out);
		state.graphicHelper.outputsByWordAddress.set(memory.byteAddress, out);
	});
}
