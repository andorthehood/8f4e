import { getModuleId } from '@8f4e/compiler/syntax';

import parseOutputs from './codeParser';

import type { CodeBlockGraphicData, Output, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateOutputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.outputs = [];
	parseOutputs(graphicData.code).forEach(output => {
		const memory = state.compiler.compiledModules[getModuleId(graphicData.code) || '']?.memoryMap[output.id];

		if (!memory) {
			return;
		}

		const out: Output = {
			width: state.graphicHelper.viewport.vGrid * 2,
			height: state.graphicHelper.viewport.hGrid,
			x: graphicData.width - 3 * state.graphicHelper.viewport.vGrid,
			y: gapCalculator(output.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
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
