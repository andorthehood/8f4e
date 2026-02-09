import type { CodeBlockGraphicData } from '~/types';

export default function gaps(graphicData: CodeBlockGraphicData) {
	graphicData.gaps.clear();

	graphicData.extras.errorMessages.forEach(error => {
		graphicData.gaps.set(error.lineNumber, { size: error.message.length });
	});

	graphicData.code.forEach((line, lineNumber) => {
		// Match semicolon comment lines with @ directives
		const commentMatch = line.match(/^\s*;\s*@(\w+)/);
		if (commentMatch) {
			const directive = commentMatch[1];

			if (directive === 'plot') {
				graphicData.gaps.set(lineNumber, { size: 8 });
			}

			if (directive === 'scan') {
				graphicData.gaps.set(lineNumber, { size: 2 });
			}

			if (directive === 'slider') {
				graphicData.gaps.set(lineNumber, { size: 2 });
			}

			if (directive === 'piano') {
				graphicData.gaps.set(lineNumber, { size: 6 });
			}
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
