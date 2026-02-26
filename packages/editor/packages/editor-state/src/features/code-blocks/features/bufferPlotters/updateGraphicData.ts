import parseBufferPlotters from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

export default function updateBufferPlottersGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.bufferPlotters = [];
	parseBufferPlotters(graphicData.code).forEach(plotter => {
		if (!graphicData.moduleId) {
			return;
		}

		const buffer = resolveMemoryIdentifier(state, graphicData.moduleId, plotter.bufferMemoryId);
		const bufferLength = resolveMemoryIdentifier(state, graphicData.moduleId, plotter.bufferLengthMemoryId);

		if (!buffer) {
			return;
		}

		graphicData.extras.bufferPlotters.push({
			width: state.viewport.vGrid * 2,
			height: state.viewport.hGrid,
			x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
			y: (gapCalculator(plotter.lineNumber, graphicData.gaps) + 1) * state.viewport.hGrid,
			buffer,
			minValue: plotter.minValue,
			maxValue: plotter.maxValue,
			bufferLength,
		});
	});
}
