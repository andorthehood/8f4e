export interface DisplayLine {
	rawRow: number;
	text: string;
	isPlaceholder?: boolean;
}

export interface CodeBlockDisplayModel {
	lines: DisplayLine[];
	displayRowToRawRow: number[];
	rawRowToDisplayRow: Array<number | undefined>;
	isCollapsed: boolean;
}

export interface BuildDisplayModelOptions {
	hideAfterRawRow?: number;
	isExpandedForEditing?: boolean;
}
