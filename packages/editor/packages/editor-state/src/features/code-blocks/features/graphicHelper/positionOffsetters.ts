import { instructionParser } from '@8f4e/compiler/syntax';

import type { CodeBlockGraphicData, State } from '~/types';

import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

export function parsePositionOffsetters(code: string[]) {
	return code.reduce(
		(acc, line) => {
			const [, instruction, ...args] = (line.match(instructionParser) ?? []) as [never, string, string, string, string];

			if (instruction === '#' && args[0] === 'offset') {
				return [...acc, { axis: args[1], memory: args[2] }];
			}
			return acc;
		},
		[] as Array<{ axis: string; memory: string }>
	);
}

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.positionOffsetterXWordAddress = undefined;
	graphicData.positionOffsetterYWordAddress = undefined;
	const offsetters = parsePositionOffsetters(graphicData.code);

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
			graphicData.positionOffsetterXWordAddress = memory.memory.wordAlignedAddress;
		}
		if (offsetter.axis === 'y') {
			graphicData.positionOffsetterYWordAddress = memory.memory.wordAlignedAddress;
		}
	});
}
