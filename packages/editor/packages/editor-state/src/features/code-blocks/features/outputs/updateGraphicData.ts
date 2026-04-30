import parseOutputs from './codeParser';

import type { CodeBlockGraphicData, Output, State } from '@8f4e/editor-state-types';

import gapCalculator from '~/features/code-editing/gapCalculator';

const CONNECTOR_WIDTH_GRID_CELLS = 3;

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

		const width = state.viewport.vGrid * CONNECTOR_WIDTH_GRID_CELLS;
		const height = state.viewport.hGrid;
		const x = graphicData.width - 3 * state.viewport.vGrid;
		const y = gapCalculator(output.lineNumber, graphicData.gaps) * state.viewport.hGrid;

		const out: Output = {
			width,
			height,
			x,
			y,
			wireX: Math.round(x + width / 2),
			wireY: Math.round(y + height / 2),
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
