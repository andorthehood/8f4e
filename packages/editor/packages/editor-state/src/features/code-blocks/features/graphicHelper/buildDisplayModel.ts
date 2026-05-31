import type { BuildDisplayModelOptions, CodeBlockDisplayModel, DisplayLine } from '@8f4e/editor-state-types';

function getVisibleRawRows(
	code: string[],
	hideAfterRawRow: number | undefined,
	isExpandedForEditing: boolean
): number[] {
	if (hideAfterRawRow === undefined || isExpandedForEditing) {
		return code.map((_, rawRow) => rawRow);
	}

	return code.flatMap((_, rawRow) => {
		if (rawRow <= hideAfterRawRow) {
			return [rawRow];
		}

		return [];
	});
}

function shouldShowCollapsedPlaceholder(
	code: string[],
	hideAfterRawRow: number | undefined,
	isExpandedForEditing: boolean
): hideAfterRawRow is number {
	return hideAfterRawRow !== undefined && !isExpandedForEditing && hideAfterRawRow < code.length - 1;
}

export default function buildDisplayModel(
	code: string[],
	{ hideAfterRawRow, isExpandedForEditing = false }: BuildDisplayModelOptions = {}
): CodeBlockDisplayModel {
	const visibleRawRows = getVisibleRawRows(code, hideAfterRawRow, isExpandedForEditing);
	const lines: DisplayLine[] = visibleRawRows.map(rawRow => ({
		rawRow,
		text: code[rawRow] || '',
	}));

	if (shouldShowCollapsedPlaceholder(code, hideAfterRawRow, isExpandedForEditing)) {
		lines.push({
			rawRow: hideAfterRawRow,
			text: '...',
			isPlaceholder: true,
		});
	}

	const displayRowToRawRow = lines.map(line => line.rawRow);
	const rawRowToDisplayRow = code.map(() => undefined as number | undefined);
	lines.forEach((line, displayRow) => {
		rawRowToDisplayRow[line.rawRow] = displayRow;
	});

	return {
		lines,
		displayRowToRawRow,
		rawRowToDisplayRow,
		isCollapsed: hideAfterRawRow !== undefined && !isExpandedForEditing,
	};
}
