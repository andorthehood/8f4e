export interface ExpandedLine {
	line: string;
	callSiteLineNumber: number;
	macroId?: string;
}

export interface MacroDefinition {
	name: string;
	body: string[];
	definitionLineNumber: number;
}
