import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '@8f4e/editor-state-types';

import resolveMemoryIdentifier from '~/pureHelpers/resolveMemoryIdentifier';

export function parsePositionOffsetters(parsedDirectives: ParsedDirectiveRecord[]) {
	return parsedDirectives
		.filter(d => d.prefix === '@' && d.name === 'offset' && d.args.length >= 2)
		.map(d => ({ axis: d.args[0], memory: d.args[1] }));
}

export default function (graphicData: CodeBlockGraphicData, state: State) {
	graphicData.positionOffsetterXWordAddress = undefined;
	graphicData.positionOffsetterYWordAddress = undefined;
	const offsetters = parsePositionOffsetters(graphicData.parsedDirectives);

	if (offsetters.length === 0) {
		graphicData.offsetX = 0;
		graphicData.offsetY = 0;
	}

	offsetters.forEach(offsetter => {
		if (!graphicData.moduleId) {
			return;
		}

		const memory = resolveMemoryIdentifier(state, graphicData.moduleId, offsetter.memory);

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
