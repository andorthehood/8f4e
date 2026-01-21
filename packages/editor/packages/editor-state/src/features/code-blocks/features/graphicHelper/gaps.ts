import { instructionParser } from '@8f4e/compiler/syntax';

import type { CodeBlockGraphicData } from '~/types';

export default function gaps(graphicData: CodeBlockGraphicData) {
	graphicData.gaps.clear();

	graphicData.extras.errorMessages.forEach(error => {
		graphicData.gaps.set(error.lineNumber, { size: error.message.length });
	});

	graphicData.code.forEach((line, lineNumber) => {
		const [, instruction, directive] = (line.match(instructionParser) ?? []) as [never, string, string];

		if (instruction === '#' && directive === 'plot') {
			graphicData.gaps.set(lineNumber, { size: 8 });
		}

		if (instruction === '#' && directive === 'scan') {
			graphicData.gaps.set(lineNumber, { size: 2 });
		}

		if (instruction === '#' && directive === 'slider') {
			graphicData.gaps.set(lineNumber, { size: 2 });
		}

		if (instruction === '#' && directive === 'piano') {
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
