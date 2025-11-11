import { parseOutputs } from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';
import { getModuleId } from '../../../../helpers/codeParsers';

import type { CodeBlockGraphicData, Output, State } from '../../../../types';

export default function updateOutputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.outputs.clear();
	parseOutputs(graphicData.trimmedCode).forEach(output => {
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

		graphicData.extras.outputs.set(output.id, out);
		state.graphicHelper.outputsByWordAddress.set(memory.byteAddress, out);
	});
}
