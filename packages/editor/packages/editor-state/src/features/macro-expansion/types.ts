/**
 * Types for macro expansion feature - manages macro definitions and expansion.
 */

/**
 * A macro definition extracted from a code block.
 */
export interface MacroDefinition {
	name: string;
	body: string[];
	blockId: string | number;
}

/**
 * Line mapping entry for macro expansion.
 * Maps expanded lines back to their original call-site location.
 */
export interface LineMapping {
	expandedLineNumber: number;
	originalLineNumber: number;
	originalBlockId: string | number;
}

/**
 * Result of macro expansion on a code block or combined source.
 */
export interface MacroExpansionResult {
	expandedCode: string[];
	lineMappings: LineMapping[];
	errors: Array<{
		message: string;
		lineNumber: number;
		blockId: string | number;
	}>;
}

/**
 * Collection of macro definitions with validation errors.
 */
export interface MacroCollection {
	macros: Map<string, MacroDefinition>;
	errors: Array<{
		message: string;
		blockId: string | number;
	}>;
}
