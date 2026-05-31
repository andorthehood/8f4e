import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import type { DirectiveDerivedState } from '../directives/registry';

function getDisplayRow(rawRow: number, directiveState: DirectiveDerivedState): number | undefined {
	return directiveState.displayModel.rawRowToDisplayRow[rawRow];
}

export default function gaps(graphicData: CodeBlockGraphicData, directiveState: DirectiveDerivedState) {
	graphicData.gaps.clear();

	graphicData.widgets.errorMessages.forEach(error => {
		const displayRow = getDisplayRow(error.lineNumber, directiveState);
		if (displayRow !== undefined) {
			graphicData.gaps.set(displayRow, { size: error.message.length });
		}
	});

	directiveState.layoutContributions.forEach(contribution => {
		const displayRow = getDisplayRow(contribution.rawRow, directiveState);
		if (displayRow !== undefined) {
			graphicData.gaps.set(displayRow, { size: contribution.rows });
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
