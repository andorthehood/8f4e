import { getModuleId } from '@8f4e/compiler/syntax';

import parseInputs from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateInputsGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.inputs = [];
	parseInputs(graphicData.code).forEach(input => {
		const memory = state.compiler.compiledModules[getModuleId(graphicData.code) || '']?.memoryMap[input.id];

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
