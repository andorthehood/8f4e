import instructionParser from '../instructionParser';
import { gapCalculator } from '../../../../helpers/editor';
import { getModuleId } from '../../../../helpers/codeParsers';

import type { CodeBlockGraphicData, Output, State } from '../../../../types';

export function parseOutputs(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string];

			if (instruction === 'int' || instruction === 'float' || instruction === 'int[]' || instruction === 'float[]') {
				return [...acc, { id: args[0], lineNumber: index }];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number }>
	);
}

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.outputs.clear();
	parseOutputs(graphicData.trimmedCode).forEach(output => {
		const memory = state.compiler.compiledModules[getModuleId(graphicData.code) || '']?.memoryMap[output.id];

		if (!memory) {
			return;
		}

		const out: Output = {
			width: state.graphicHelper.globalViewport.vGrid * 2,
			height: state.graphicHelper.globalViewport.hGrid,
			x: graphicData.width - 3 * state.graphicHelper.globalViewport.vGrid,
			y: gapCalculator(output.lineNumber, graphicData.gaps) * state.graphicHelper.globalViewport.hGrid,
			id: output.id,
			codeBlock: graphicData,
			calibratedMax: 0,
			calibratedMin: 0,
			memory,
		};

		graphicData.extras.outputs.set(output.id, out);
		state.graphicHelper.outputsByWordAddress.set(memory.byteAddress, out);
	});
}
