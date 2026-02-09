import type { CodeBlockGraphicData, State } from '~/types';

import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

export function parsePositionOffsetters(code: string[]) {
	return code.reduce(
		(acc, line) => {
			// Match semicolon comment lines with @offset directive
			const commentMatch = line.match(/^\s*;\s*@(\w+)\s+(.*)/);
			if (commentMatch && commentMatch[1] === 'offset') {
				const args = commentMatch[2].trim().split(/\s+/);
				return [...acc, { axis: args[0], memory: args[1] }];
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
