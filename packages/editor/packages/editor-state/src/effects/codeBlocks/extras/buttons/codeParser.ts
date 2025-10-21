import instructionParser from '../instructionParser';
import { gapCalculator } from '../../../../helpers/editor';

import type { CodeBlockGraphicData, State } from '../../../../types';

export function parseButtons(code: string[]) {
	return code.reduce(
		(acc, line, index) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string, string];

			if (instruction === 'button') {
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
	graphicData.extras.buttons.clear();
	parseButtons(graphicData.trimmedCode).forEach(_switch => {
		graphicData.extras.buttons.set(_switch.id, {
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
