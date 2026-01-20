import parseBufferScanners from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

export default function updateBufferScannersGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.bufferScanners = [];
	parseBufferScanners(graphicData.code).forEach(scanner => {
		const buffer = resolveMemoryIdentifier(state, graphicData.id, scanner.bufferMemoryId);
		const pointer = resolveMemoryIdentifier(state, graphicData.id, scanner.pointerMemoryId);

		if (!buffer || !pointer) {
			return;
		}

		graphicData.extras.bufferScanners.push({
			width: graphicData.width,
			height: state.viewport.hGrid * 2,
			x: (graphicData.lineNumberColumnWidth + 2) * state.viewport.vGrid,
			y: (gapCalculator(scanner.lineNumber, graphicData.gaps) + 1) * state.viewport.hGrid,
			buffer,
			pointer,
		});
	});
}
