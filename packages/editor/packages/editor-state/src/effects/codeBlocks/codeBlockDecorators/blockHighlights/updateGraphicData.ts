import parseCodeBlocks from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.blockHighlights = [];
	parseCodeBlocks(graphicData.code).forEach(block => {
		if (!block.endLineNumber) {
			return;
		}

		graphicData.extras.blockHighlights.push({
			x: state.graphicHelper.viewport.vGrid * (2 + graphicData.lineNumberColumnWidth),
			y: gapCalculator(block.startLineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
			width: graphicData.width - state.graphicHelper.viewport.vGrid * (2 + graphicData.lineNumberColumnWidth),
			height: (block.endLineNumber - block.startLineNumber + 1) * state.graphicHelper.viewport.hGrid,
			color: 'codeBlockHighlightLevel' + ((block.depth % 3) + 1),
		});
	});
}
