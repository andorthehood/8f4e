import parseCodeBlocks from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.blockHighlights = [];
	parseCodeBlocks(graphicData.code).forEach(block => {
		if (!block.endLineNumber) {
			return;
		}

		graphicData.extras.blockHighlights.push({
			x: state.viewport.vGrid * (2 + graphicData.lineNumberColumnWidth),
			y: gapCalculator(block.startLineNumber, graphicData.gaps) * state.viewport.hGrid,
			width: graphicData.width - state.viewport.vGrid * (2 + graphicData.lineNumberColumnWidth),
			height: (block.endLineNumber - block.startLineNumber + 1) * state.viewport.hGrid,
			color: 'codeBlockHighlightLevel' + ((block.depth % 3) + 1),
		});
	});
}
