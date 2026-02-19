import parseCodeBlocks from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.blockHighlights = [];
	parseCodeBlocks(graphicData.code).forEach(block => {
		if (block.endLineNumber === undefined) {
			return;
		}

		const highlightStartLine = block.startLineNumber + 1;
		const highlightEndLine = block.endLineNumber - 1;

		if (highlightStartLine > highlightEndLine) {
			return;
		}

		graphicData.extras.blockHighlights.push({
			x: state.viewport.vGrid * (2 + graphicData.lineNumberColumnWidth),
			y: gapCalculator(highlightStartLine, graphicData.gaps) * state.viewport.hGrid,
			width: graphicData.width - state.viewport.vGrid * (2 + graphicData.lineNumberColumnWidth),
			height: (highlightEndLine - highlightStartLine + 1) * state.viewport.hGrid,
			color: 'codeBlockHighlightLevel' + ((block.depth % 3) + 1),
		});
	});
}
