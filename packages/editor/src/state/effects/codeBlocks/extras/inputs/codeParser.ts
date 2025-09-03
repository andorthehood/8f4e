import instructionParser from '../instructionParser';
import { gapCalculator } from '../../../../helpers/editor';
import { getModuleId } from '../../../../helpers/codeParsers';

import type { CodeBlockGraphicData, State } from '../../../../types';
import type { Instruction } from '@8f4e/compiler';

export function parseInputs(code: string[]): Array<{ id: string; lineNumber: number }> {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, Instruction, string, string];

		if (instruction === 'int*' || instruction === 'float*' || instruction === 'int**' || instruction === 'float**') {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, []);
}

export default function inputs(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.inputs.clear();
	parseInputs(graphicData.trimmedCode).forEach(input => {
		const memory = state.compiler.compiledModules.get(getModuleId(graphicData.code) || '')?.memoryMap.get(input.id);

		if (!memory) {
			return;
		}

		graphicData.extras.inputs.set(input.id, {
			width: state.graphicHelper.globalViewport.vGrid * 2,
			height: state.graphicHelper.globalViewport.hGrid,
			x: 0,
			y: gapCalculator(input.lineNumber, graphicData.gaps) * state.graphicHelper.globalViewport.hGrid,
			id: input.id,
			wordAlignedAddress: memory.wordAlignedAddress,
			codeBlock: graphicData,
		});
	});
}
