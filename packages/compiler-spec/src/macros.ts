/** Source line produced by macro expansion with its originating call site. */
export interface ExpandedLine {
	line: string;
	callSiteLineNumber: number;
	macroId?: string;
}

/** Parsed macro definition body and declaration location. */
export interface MacroDefinition {
	name: string;
	body: string[];
	definitionLineNumber: number;
}
