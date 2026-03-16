/**
 * Types for global editor directives.
 * Editor directives use `; @<name> <args...>` syntax.
 */
import type { CodeError } from '~/types';

export interface ParsedGlobalEditorDirective {
	name: string;
	rawRow: number;
	args: string[];
}

export interface ResolvedGlobalEditorDirectives {
	/** Export file base name from `; @exportFileName <value>` directives */
	exportFileName?: string;
}

export interface GlobalEditorDirectivePlugin {
	name: string;
	apply?: (
		directive: ParsedGlobalEditorDirective,
		draft: GlobalEditorDirectiveResolutionResult,
		context: { codeBlockId: string | number }
	) => void;
}

export interface GlobalEditorDirectiveResolutionResult {
	resolved: ResolvedGlobalEditorDirectives;
	errors: CodeError[];
}
