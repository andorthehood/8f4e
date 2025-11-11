import parseCodeBlocks from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.blockHighlights = [];
	parseCodeBlocks(graphicData.trimmedCode).forEach(block => {
		if (!block.endLineNumber) {
			return;
		}

		graphicData.extras.blockHighlights.push({
			x: state.graphicHelper.globalViewport.vGrid * (2 + graphicData.padLength),
			y: gapCalculator(block.startLineNumber, graphicData.gaps) * state.graphicHelper.globalViewport.hGrid,
			width: graphicData.width - state.graphicHelper.globalViewport.vGrid * (2 + graphicData.padLength),
			height: (block.endLineNumber - block.startLineNumber + 1) * state.graphicHelper.globalViewport.hGrid,
			color: 'codeBlockHighlightLevel' + ((block.depth % 3) + 1),
		});
	});
}
