import parseSliders from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function updateSlidersGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.sliders = [];
	parseSliders(graphicData.code).forEach(slider => {
		const memory = state.compiler.compiledModules[graphicData.id]?.memoryMap[slider.id];

		if (!memory) {
			return;
		}

		// Determine default min/max based on memory type if not provided
		let min = slider.min;
		let max = slider.max;

		if (min === undefined || max === undefined) {
			if (memory.isInteger) {
				// Default range for integers: 0..127
				min = min ?? 0;
				max = max ?? 127;
			} else {
				// Default range for floats: 0..1
				min = min ?? 0;
				max = max ?? 1;
			}
		}

		graphicData.extras.sliders.push({
			width: graphicData.width - (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
			height: state.viewport.hGrid * 2,
			x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
			y: (gapCalculator(slider.lineNumber, graphicData.gaps) + 1) * state.viewport.hGrid,
			id: slider.id,
			min,
			max,
			step: slider.step,
		});
	});
}
