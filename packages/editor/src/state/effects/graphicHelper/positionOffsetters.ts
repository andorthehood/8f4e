import { Instruction, instructionParser } from '@8f4e/compiler';

import resolveMemoryIdentifier from '../../helpers/resolveMemoryIdentifier';
import { ExtendedInstructionSet, ModuleGraphicData, State } from '../../types';

export function parsePositionOffsetters(code: string[]) {
	return code.reduce((acc, line) => {
		const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [
			never,
			Instruction | ExtendedInstructionSet,
			string,
			string,
			string
		];

		if (instruction === 'offset') {
			return [...acc, { axis: args[0], memory: args[1] }];
		}
		return acc;
	}, [] as Array<{ axis: string; memory: string }>);
}

export default function (graphicData: ModuleGraphicData, state: State) {
	graphicData.positionOffsetterXWordAddress = undefined;
	graphicData.positionOffsetterYWordAddress = undefined;
	const offsetters = parsePositionOffsetters(graphicData.trimmedCode);

	if (offsetters.length === 0) {
		graphicData.offsetX = 0;
		graphicData.offsetY = 0;
	}

	offsetters.forEach(offsetter => {
		const memory = resolveMemoryIdentifier(state, graphicData.id, offsetter.memory);

		if (!memory || !memory.memory.isInteger) {
			return;
		}

		if (offsetter.axis === 'x') {
			graphicData.positionOffsetterXWordAddress = memory.memory.wordAddress;
		}
		if (offsetter.axis === 'y') {
			graphicData.positionOffsetterYWordAddress = memory.memory.wordAddress;
		}
	});
}
