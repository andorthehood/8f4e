import { Instruction, instructionParser } from '@8f4e/compiler';

import { ExtendedInstructionSet, CodeBlockGraphicData, State } from '../../types';
import { gapCalculator } from '../../helpers/editor';
import resolveMemoryIdentifier from '../../helpers/resolveMemoryIdentifier';

export function parseDebuggers(code: string[]) {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string
		];

		if (instruction === 'debug') {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, [] as Array<{ id: string; lineNumber: number }>);
}

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.debuggers.clear();
	parseDebuggers(graphicData.trimmedCode).forEach(_debugger => {
		const memory = resolveMemoryIdentifier(state, graphicData.id, _debugger.id);

		if (!memory) {
			return;
		}

		graphicData.debuggers.set(_debugger.id, {
			width: state.graphicHelper.viewport.vGrid * 2,
			height: state.graphicHelper.viewport.hGrid,
			x:
				state.graphicHelper.viewport.vGrid * (3 + graphicData.padLength) +
				state.graphicHelper.viewport.vGrid * graphicData.trimmedCode[_debugger.lineNumber].length,
			y: gapCalculator(_debugger.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
			id: _debugger.id,
			memory: memory.memory,
			showAddress: memory.showAddress,
			showEndAddress: memory.showEndAddress,
			showBinary: memory.showBinary,
			bufferPointer: memory.bufferPointer,
		});
	});
}
