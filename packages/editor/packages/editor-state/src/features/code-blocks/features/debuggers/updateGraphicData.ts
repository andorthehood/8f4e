import parseDebuggers from './codeParser';

import type { CodeBlockGraphicData, State } from '~/types';

import gapCalculator from '~/features/code-editing/gapCalculator';
import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

export default function updateDebuggersGraphicData(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.debuggers = [];
	parseDebuggers(graphicData.code).forEach(_debugger => {
		if (!graphicData.moduleId) {
			return;
		}

		const memory = resolveMemoryIdentifier(state, graphicData.moduleId, _debugger.id);

		if (!memory) {
			return;
		}

		graphicData.extras.debuggers.push({
			width: state.viewport.vGrid * 2,
			height: state.viewport.hGrid,
			x:
				state.viewport.vGrid * (3 + graphicData.lineNumberColumnWidth) +
				state.viewport.vGrid * graphicData.code[_debugger.lineNumber].length,
			y: gapCalculator(_debugger.lineNumber, graphicData.gaps) * state.viewport.hGrid,
			id: _debugger.id,
			memory: memory.memory,
			showAddress: memory.showAddress,
			showEndAddress: memory.showEndAddress,
			showBinary: memory.showBinary,
			bufferPointer: memory.bufferPointer,
		});
	});
}
