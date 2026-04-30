import parseInputs from './codeParser';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

import gapCalculator from '~/features/code-editing/gapCalculator';

const CONNECTOR_WIDTH_GRID_CELLS = 3;

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

		const width = state.viewport.vGrid * CONNECTOR_WIDTH_GRID_CELLS;
		const height = state.viewport.hGrid;
		const x = 0;
		const y = gapCalculator(input.lineNumber, graphicData.gaps) * state.viewport.hGrid;

		graphicData.widgets.inputs.push({
			width,
			height,
			x,
			y,
			wireX: Math.round(x + width / 2),
			wireY: Math.round(y + height / 2),
			id: input.id,
			wordAlignedAddress: memory.wordAlignedAddress,
			codeBlock: graphicData,
		});
	});
}
