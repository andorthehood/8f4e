export interface ParsedDirective {
	name: string;
	args: string[];
	codeBlockId: string;
	codeBlockCreationId: number;
	lineNumber: number;
	sourceOrder: number;
	rawLine: string;
	argText: string | null;
}
