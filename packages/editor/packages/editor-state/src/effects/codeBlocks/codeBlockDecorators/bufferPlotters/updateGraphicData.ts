import { parseBufferPlotters } from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';
import resolveMemoryIdentifier from '../../../../helpers/resolveMemoryIdentifier';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function updateBufferPlottersGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.bufferPlotters.clear();
	parseBufferPlotters(graphicData.trimmedCode).forEach(plotter => {
		const buffer = resolveMemoryIdentifier(state, graphicData.id, plotter.bufferMemoryId);
		const bufferLength = resolveMemoryIdentifier(state, graphicData.id, plotter.bufferLengthMemoryId);

		if (!buffer) {
			return;
		}

		graphicData.extras.bufferPlotters.set(plotter.bufferMemoryId, {
			width: state.graphicHelper.viewport.vGrid * 2,
			height: state.graphicHelper.viewport.hGrid,
			x: 0,
			y: (gapCalculator(plotter.lineNumber, graphicData.gaps) + 1) * state.graphicHelper.viewport.hGrid,
			buffer,
			minValue: plotter.minValue,
			maxValue: plotter.maxValue,
			bufferLength,
		});
	});
}
