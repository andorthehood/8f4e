import instructionParser from './codeBlockDecorators/instructionParser';

import type { CodeBlockGraphicData, State } from '../../types';

export default function gaps(graphicData: CodeBlockGraphicData, state: State) {
	graphicData.gaps.clear();
	state.compiler.compilationErrors.forEach(compilationError => {
		if (compilationError.moduleId !== graphicData.id) {
			return;
		}
		graphicData.gaps.set(compilationError.lineNumber, { size: 2 });
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
