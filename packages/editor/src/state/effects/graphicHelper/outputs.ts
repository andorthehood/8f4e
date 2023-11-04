import { Instruction, instructionParser } from '@8f4e/compiler';

import { CodeBlockGraphicData, Output, State } from '../../types';
import { gapCalculator } from '../../helpers/editor';
import { getModuleId } from '../../helpers/codeParsers';

export function parseOutputs(code: string[]) {
	return code.reduce((acc, line, index) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, Instruction, string, string];

		if (instruction === 'int' || instruction === 'float' || instruction === 'int[]' || instruction === 'float[]') {
			return [...acc, { id: args[0], lineNumber: index }];
		}
		return acc;
	}, [] as Array<{ id: string; lineNumber: number }>);
}

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.outputs.clear();
	parseOutputs(graphicData.trimmedCode).forEach(output => {
		const memory = state.compiler.compiledModules.get(getModuleId(graphicData.code) || '')?.memoryMap.get(output.id);

		if (!memory) {
			return;
		}

		const out: Output = {
			width: state.graphicHelper.viewport.vGrid * 2,
			height: state.graphicHelper.viewport.hGrid,
			x: graphicData.width - 3 * state.graphicHelper.viewport.vGrid,
			y: gapCalculator(output.lineNumber, graphicData.gaps) * state.graphicHelper.viewport.hGrid,
			id: output.id,
			codeBlock: graphicData,
			calibratedMax: 0,
			calibratedMin: 0,
			memory,
		};

		graphicData.outputs.set(output.id, out);
		state.graphicHelper.outputsByWordAddress.set(memory.byteAddress, out);
	});
}
