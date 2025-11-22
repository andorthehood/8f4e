import { parseDebuggers } from './codeParser';

import { gapCalculator } from '../../../../helpers/editor';
import resolveMemoryIdentifier from '../../../../helpers/resolveMemoryIdentifier';

import type { CodeBlockGraphicData, State } from '../../../../types';

export default function updateDebuggersGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.debuggers = {};
	parseDebuggers(graphicData.code).forEach(_debugger => {
		const memory = resolveMemoryIdentifier(state, graphicData.id, _debugger.id);

		if (!memory) {
			return;
		}

		graphicData.extras.debuggers[_debugger.id] = {
			width: state.graphicHelper.viewport.vGrid * 2,
			height: state.graphicHelper.viewport.hGrid,
			x:
				state.graphicHelper.viewport.vGrid * (3 + graphicData.lineNumberColumnWidth) +
				state.graphicHelper.viewport.vGrid * graphicData.code[_debugger.lineNumber].length,
			y: gapCalculator(_debugger.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
			id: _debugger.id,
			memory: memory.memory,
			showAddress: memory.showAddress,
			showEndAddress: memory.showEndAddress,
			showBinary: memory.showBinary,
			bufferPointer: memory.bufferPointer,
		};
	});
}
