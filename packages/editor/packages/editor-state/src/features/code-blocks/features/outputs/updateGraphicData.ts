import parseOutputs from './codeParser';

import type { CodeBlockGraphicData, Output, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateOutputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.widgets.outputs = [];
	const moduleId = graphicData.moduleId;
	if (!moduleId) {
		return;
	}

	parseOutputs(graphicData.code).forEach(output => {
		const memory = state.compiler.compiledModules[moduleId]?.memoryMap[output.id];

		if (!memory) {
			return;
		}

		const width = state.viewport.vGrid * 2;
		const height = state.viewport.hGrid;
		const x = graphicData.width - 3 * state.viewport.vGrid;
		const y = gapCalculator(output.lineNumber, graphicData.gaps) * state.viewport.hGrid;

		const out: Output = {
			width,
			height,
			x,
			y,
			wireX: x + width / 2,
			wireY: y + height / 2,
			id: output.id,
			codeBlock: graphicData,
			calibratedMax: 0,
			calibratedMin: 0,
			memory,
		};

		graphicData.widgets.outputs.push(out);
		state.graphicHelper.outputsByWordAddress.set(memory.byteAddress, out);
	});
}
