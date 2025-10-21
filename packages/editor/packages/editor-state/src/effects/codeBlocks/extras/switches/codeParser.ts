import instructionParser from '../instructionParser';
import { gapCalculator } from '../../../../helpers/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export function parseSwitches(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string, string];

			if (instruction === 'switch') {
				return [
					...acc,
					{ id: args[0], lineNumber: index, onValue: parseInt(args[2], 10) || 1, offValue: parseInt(args[1], 10) || 0 },
				];
			}
			return acc;
		},
		[] as Array<{ id: string; lineNumber: number; onValue: number; offValue: number }>
	);
}

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.extras.switches.clear();
	parseSwitches(graphicData.trimmedCode).forEach(_switch => {
		graphicData.extras.switches.set(_switch.id, {
			width: state.graphicHelper.globalViewport.vGrid * 4,
			height: state.graphicHelper.globalViewport.hGrid,
			x: graphicData.width - 4 * state.graphicHelper.globalViewport.vGrid,
			y: gapCalculator(_switch.lineNumber, graphicData.gaps) * state.graphicHelper.globalViewport.hGrid,
			id: _switch.id,
			offValue: _switch.offValue,
			onValue: _switch.onValue,
		});
	});
}
