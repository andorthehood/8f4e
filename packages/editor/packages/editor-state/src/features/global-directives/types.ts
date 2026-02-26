export interface ParsedDirective {
	name: string;
	args: string[];
	lineNumber: number;
	sourceOrder: number;
	rawLine: string;
	argText: string | null;
}
