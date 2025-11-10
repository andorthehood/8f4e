import { parseInputs } from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';
import { getModuleId } from '../../../../helpers/codeParsers';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function updateInputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.inputs.clear();
	parseInputs(graphicData.trimmedCode).forEach(input => {
		const memory = state.compiler.compiledModules[getModuleId(graphicData.code) || '']?.memoryMap[input.id];

		if (!memory) {
			return;
		}

		graphicData.extras.inputs.set(input.id, {
			width: state.graphicHelper.globalViewport.vGrid * 2,
			height: state.graphicHelper.globalViewport.hGrid,
			x: 0,
			y: gapCalculator(input.lineNumber, graphicData.gaps) * state.graphicHelper.globalViewport.hGrid,
			id: input.id,
			wordAlignedAddress: memory.wordAlignedAddress,
			codeBlock: graphicData,
		});
	});
}
