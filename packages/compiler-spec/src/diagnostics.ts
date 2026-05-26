import type { CompilerASTLine } from './ast';
import type { CodegenContext, CompilationContext } from './semantic';
import type { CompilerSourceBlockType } from './instructions';

/**
 * Internal compiler-stage error shape returned by getError().
 * This is not the public cross-stage contract; consumers should use CompilerDiagnostic.
 */
export interface CompilerStageError {
	message: string;
	line: CompilerASTLine;
	context?: CodegenContext | CompilationContext;
	code: number;
}

/**
 * The shared, serializable diagnostic shape exposed to all consumers of the compiler pipeline.
 * Both syntax errors (SyntaxRulesError) and semantic/compiler errors conform to this contract
 * once serialized. Consumers must not special-case either stage.
 */
export interface CompilerDiagnosticLine {
	lineNumberBeforeMacroExpansion: number;
	lineNumberAfterMacroExpansion: number;
	instruction?: string;
	arguments?: unknown[];
}

export interface CompilerDiagnosticContext {
	codeBlockId?: string;
	codeBlockType?: CompilerSourceBlockType;
}

export interface CompilerDiagnostic {
	/** Numeric ErrorCode for compiler errors; numeric SyntaxErrorCode for syntax errors. */
	code: number;
	message: string;
	line: CompilerDiagnosticLine;
	context: CompilerDiagnosticContext;
}
