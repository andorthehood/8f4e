import type { CodeBlockGraphicData } from '@8f4e/editor-state-types';
import type { DirectiveDerivedState } from './features/directives/registry';

function getDisplayRow(rawRow: number, directiveState: DirectiveDerivedState): number | undefined {
	return directiveState.displayModel.rawRowToDisplayRow[rawRow];
}

function addGap(graphicData: CodeBlockGraphicData, displayRow: number, size: number): void {
	const existing = graphicData.gaps.get(displayRow);
	graphicData.gaps.set(displayRow, { size: (existing?.size ?? 0) + size });
}

export default function gaps(graphicData: CodeBlockGraphicData, directiveState: DirectiveDerivedState) {
	graphicData.gaps.clear();

	// TODO: Error message layout should contribute through the same layout contribution path as other features.
	// This is legacy coupling, not a pattern to copy: new gap sources should add layout contributions instead.
	graphicData.widgets.errorMessages.forEach(error => {
		const displayRow = getDisplayRow(error.lineNumber, directiveState);
		if (displayRow !== undefined) {
			addGap(graphicData, displayRow, error.message.length);
		}
	});

	directiveState.layoutContributions.forEach(contribution => {
		const displayRow = getDisplayRow(contribution.rawRow, directiveState);
		if (displayRow !== undefined) {
			addGap(graphicData, displayRow, contribution.rows);
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
