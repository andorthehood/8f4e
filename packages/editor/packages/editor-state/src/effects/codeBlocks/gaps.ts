import { instructionParser } from '@8f4e/syntax-rules';

import type { CodeBlockGraphicData } from '../../types';

export default function gaps(graphicData: CodeBlockGraphicData) {
	graphicData.gaps.clear();

	graphicData.extras.errorMessages.forEach(error => {
		graphicData.gaps.set(error.lineNumber, { size: error.message.length });
	});

	graphicData.code.forEach((line, lineNumber) => {
		const [, instruction] = (line.match(instructionParser) ?? []) as [never, string];

		if (instruction === 'plot') {
			graphicData.gaps.set(lineNumber, { size: 8 });
		}

		if (instruction === 'piano') {
			graphicData.gaps.set(lineNumber, { size: 6 });
		}
	});

	const gaps = Array.from(graphicData.gaps).sort(([a], [b]) => {
		return b - a;
	});

	gaps.forEach(([row, gap]) => {
		graphicData.codeToRender.splice(row + 1, 0, ...new Array(gap.size).fill(' '));
		graphicData.codeColors.splice(row + 1, 0, ...new Array(gap.size).fill([]));
	});
}
