import type { CompilerASTLine } from './ast';
import type { SourceMetadata } from './compiled';
import type { CompilerSourceBlockType } from './instructions';
import type { CodegenContext, CompilationContext } from './semantic';

/** Source block context attached to a serialized compiler diagnostic. */
export interface CompilerDiagnosticContext {
	codeBlockId?: string;
	codeBlockType?: CompilerSourceBlockType;
	projectBlockId?: number;
	source?: SourceMetadata;
}

/**
 * Internal compiler-stage error shape returned by getError().
 * This is not the public cross-stage contract; consumers should use CompilerDiagnostic.
 */
export interface CompilerStageError {
	message: string;
	line: CompilerASTLine;
	context?: CodegenContext | CompilationContext | CompilerDiagnosticContext;
	code: number;
}

/**
 * The shared, serializable diagnostic shape exposed to all consumers of the compiler pipeline.
 * Both syntax errors (SyntaxRulesError) and semantic/compiler errors conform to this contract
 * once serialized. Consumers must not special-case either stage.
 */
export interface CompilerDiagnosticLine {
	lineNumber: number;
	instruction?: string;
	arguments?: unknown[];
}

/** Serializable compiler diagnostic shared across syntax and semantic stages. */
export interface CompilerDiagnostic {
	/** Numeric ErrorCode for compiler errors; numeric SyntaxErrorCode for syntax errors. */
	code: number;
	message: string;
	line: CompilerDiagnosticLine;
	context: CompilerDiagnosticContext;
}
