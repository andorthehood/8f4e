import { instructionParser } from '@8f4e/compiler/syntax';

import type { CodeBlockGraphicData } from '~/types';

export const GAP_SIZES: Record<string, number> = {
	plot: 8,
	scan: 2,
	slider: 2,
	piano: 6,
};

export default function gaps(graphicData: CodeBlockGraphicData) {
	graphicData.gaps.clear();

	graphicData.extras.errorMessages.forEach(error => {
		graphicData.gaps.set(error.lineNumber, { size: error.message.length });
	});

	graphicData.code.forEach((line, lineNumber) => {
		const [, instruction, directive] = (line.match(instructionParser) ?? []) as [never, string, string];
		if (instruction === '#' && directive && GAP_SIZES[directive]) {
			graphicData.gaps.set(lineNumber, { size: GAP_SIZES[directive] });
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
